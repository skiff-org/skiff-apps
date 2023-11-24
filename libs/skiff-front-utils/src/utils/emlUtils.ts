import axios from 'axios';
import rfc2047 from 'rfc2047';
import { decryptDatagramV2 } from 'skiff-crypto';
import { RawMimeDatagram } from 'skiff-front-graphql';
import isEmail from 'validator/lib/isEmail';
import isURL from 'validator/lib/isURL';
import { DOMParser } from 'xmldom';

import { UnsubscribeLinks } from '../types/unsubscribe.types';

interface SubjectBodyQueryParams {
  subject: string | undefined;
  body: string | undefined;
}

interface ParsedHeaders {
  [key: string]: string;
}

const MAILTO_REGEX = /<mailto:([^>]+)>/i;
const HTTP_REGEX = /<((?:http[s]?):\/\/[^>]+)>/i;
const UNSUBSCRIBE_KEY_WORDS = [
  'unsubscribe',
  'opt-out',
  'opt out',
  'update your preferences',
  'manage your preferences',
  'email preferences',
  'subscriptions',
  "i don't want these emails",
  'remove this email',
  'remove this e-mail'
];

export const getRawMime = async (encryptedRawMimeUrl: string, decryptedSessionKey: string) => {
  const resp = await axios.get(encryptedRawMimeUrl);

  if (!resp.data || typeof resp.data !== 'string') {
    return;
  }
  const data = resp.data;
  const { rawMime } = decryptDatagramV2(RawMimeDatagram, decryptedSessionKey, data).body;
  return rawMime;
};

/**
 * Give the raw MIME of an email, parse out the headers and its values.
 * This is currently used to parse headers for the "View headers" feature,
 * and it's used to determine whether you can unsubscribe from an email or not.
 */
export const parseHeaders = (rawMimeContent: string): ParsedHeaders => {
  const result: ParsedHeaders = {};

  const lines = rawMimeContent.split('\n');

  let currentHeader = '';
  let currentValue = '';
  let isHtmlContent = false;

  for (const line of lines) {
    if (isHtmlContent) {
      currentValue += line + '\n';
      continue;
    }

    const match = line.match(/^([^:\s]+):\s*(.*)/); // Match header name and value

    if (match) {
      if (currentHeader) {
        result[currentHeader] = currentValue.trim();
        currentValue = '';
      }

      currentHeader = match[1] || '';
      currentValue = match[2]?.trim() || '';

      if (currentHeader.toLowerCase() === 'content-type' && currentValue.toLowerCase().includes('text/html')) {
        isHtmlContent = true;
      }
    } else {
      currentValue += ' ' + line.trim(); // Continuation of previous header
    }
  }

  if (currentHeader) {
    result[currentHeader] = currentValue.trim(); // Add last header if any
  }

  return result;
};

/**
 * Given the value of a mailto string, we parse out the address and subject and body if included.
 * For example, if mailtoLink = 'example@skiff.com?subject=Hello&body=Hi',
 * we would return 'example@skiff.com' as the address, 'Hello' as the subject, and 'Hi as the body.
 */
const parseMailto = (
  mailtoLink: string,
  getSubjectBodyQueryParamsFromMailTo?: (queryString: string) => SubjectBodyQueryParams
) => {
  // Split the mailto link into parts separated by '?'
  const [emailAddress, queryString] = mailtoLink.split('?');

  let subject: string | undefined;
  let body: string | undefined;

  // Native uses a custom parser, as URLSearchParams is not supported
  if (getSubjectBodyQueryParamsFromMailTo) {
    const subjectBodyQueryParams = getSubjectBodyQueryParamsFromMailTo(queryString);
    subject = subjectBodyQueryParams.subject;
    body = subjectBodyQueryParams.body;
  } else if (queryString) {
    // Parse the query parameters for subject and body
    const queryParams = new URLSearchParams(queryString);
    subject = queryParams.get('subject') ?? undefined;
    body = queryParams.get('body') ?? undefined;
  }

  if (emailAddress && isEmail(emailAddress)) {
    return {
      address: emailAddress,
      subject,
      body
    };
  }
  return undefined;
};

/**
 * Given the headers of an email, parse out the 'List-Unsubscribe' header value.
 * The 'List-Unsubscribe' header value will include either a mailto link or a URL or both.
 * The mailto link will be the email address that we should send a message to in
 * order to unsubscribe, and the URL will be the link to redirect to in order to unsubscribe.
 */
const getUnsubscribeLinksFromHeaders = (
  rawMimeContent: string,
  getSubjectBodyQueryParamsFromMailTo?: (queryString: string) => SubjectBodyQueryParams
): UnsubscribeLinks | undefined => {
  const headers = parseHeaders(rawMimeContent);
  const encodedUnsubscribeHeader = headers['List-Unsubscribe'] ?? '';
  try {
    const unsubscribeHeader = rfc2047.decode(encodedUnsubscribeHeader);
    const mailtoLink = unsubscribeHeader.match(MAILTO_REGEX)?.[1];
    const httpLink = unsubscribeHeader.match(HTTP_REGEX)?.[1];

    const mailtoInfo = mailtoLink ? parseMailto(mailtoLink, getSubjectBodyQueryParamsFromMailTo) : undefined;
    if (!mailtoInfo && !httpLink) return undefined;

    return {
      mailto: mailtoInfo,
      httpLink
    };
  } catch (error) {
    // If we fail to decode the unsubscribe header, log the error
    // and continue to try other ways to parse the unsubscribe link
    console.error(error);
    return undefined;
  }
};

/**
 * Given a potential unsubscribe link, try and parse the mailto information or the redirect link.
 */
const processPotentialUnsubscribeLink = (href: string | null | undefined) => {
  if (href) {
    const mailtoInfo = parseMailto(href);
    if (mailtoInfo) return { mailto: mailtoInfo };
    if (isURL(href)) return { httpLink: href };
  }
  return undefined;
};

const getElementsByTagNames = (doc: Document, tagNames: string[]) => {
  const elements: Element[] = [];
  // Loop through the tag names and query for each one
  for (const tagName of tagNames) {
    const nodeList = doc.getElementsByTagName(tagName);

    // Convert the NodeList to an array and concatenate it with the elements array
    elements.push(...Array.from(nodeList));
  }
  return elements;
};

/**
 * Given the html of an email, try and parse out the unsubscribe link/email address from the anchor tag.
 * Emails do not all follow the same format when including unsubscribe information, so we
 * try and parse the email following a couple of standard methods:
 * 1. Try and find the anchor tag that contains "unsubscribe". E.g. <a href="link">Unsubscribe</a>
 * 2. Try and find the anchor tag where the href contains the word "unsubscribe". E.g. <a href="https://hi@test.com/unsubscribe">[text]</a>
 * 3. Try and find the anchor tag immediately after the word "unsubscribe". Eg. <p>To unsubscribe, click here [<a href="link" />]
 */
const getUnsubscribeLinksFromAnchorTag = (decryptedHtml: string | undefined) => {
  if (!decryptedHtml) {
    console.error('Could not determine unsubscribe info for email. No decryptedHtml given.');
    return undefined;
  }

  // Load the HTML content
  const emailBodyDoc = new DOMParser().parseFromString(decryptedHtml, 'text/html');
  // Fetch all anchor tags from the document just once
  const allAnchors = Array.from(getElementsByTagNames(emailBodyDoc, ['a']));

  const getUnsubscribeAnchor = (normalizedMatchWord: string, anchorList: Element[]): Element | undefined => {
    return anchorList.find((link) => link.textContent?.trim().toLowerCase().includes(normalizedMatchWord));
  };

  const getUnsubscribeInAnchorHref = (normalizedMatchWord: string, anchorList: Element[]): Element | undefined => {
    return anchorList.find((link) => {
      return link.getAttribute('href')?.toLowerCase().includes(normalizedMatchWord);
    });
  };

  // Find the "unsubscribe" text node and select the next <a> element
  const getAnchorNextToUnsubscribe = (normalizedMatchWord: string): Element | undefined => {
    const allNodes = Array.from(getElementsByTagNames(emailBodyDoc, ['p', 'span', 'a']));

    const unsubscribeNode = allNodes.find((node) => {
      return node.textContent?.trim().toLowerCase().includes(normalizedMatchWord);
    });

    if (unsubscribeNode) {
      // Search within the matched node for any <a> tags.
      const innerLink = Array.from(unsubscribeNode.getElementsByTagName('a'))[0];
      if (innerLink) {
        return innerLink;
      }

      let current: Node | null = unsubscribeNode;
      // Move past the current node to check the subsequent siblings.
      const MAX_SIBLINGS_TO_CHECK = 5;
      let siblingsChecked = 0;
      while ((current = current.nextSibling)) {
        // equivalent to Node.ELEMENT_NODE
        // We cannot use Node.ELEMENT_NODE directly as it is not supported in react native
        const elementNodeType = 1;
        // Search within the sibling if it has any <a> tags.
        if (current.nodeType === elementNodeType) {
          const link = Array.from((current as Element).getElementsByTagName('a'))[0];
          if (link) {
            return link;
          }
        }

        // If the sibling itself is an <a> tag, return it.
        if (current.nodeType === elementNodeType && (current as Element).tagName === 'A') {
          return current as Element;
        }
        if (siblingsChecked++ > MAX_SIBLINGS_TO_CHECK) {
          break;
        }
      }
    }

    return undefined;
  };

  for (const unsubscribeWordSelector of UNSUBSCRIBE_KEY_WORDS) {
    const normalizedMatchWord = unsubscribeWordSelector.toLowerCase();
    // 1. Find the anchor tag that contains "unsubscribe"
    // 2. Find the anchor tag with the "unsubscribe" in the href
    // 3. Find the "unsubscribe" text node and select the next <a> element
    const unsubscribeLinkElement =
      getUnsubscribeAnchor(normalizedMatchWord, allAnchors) ??
      getUnsubscribeInAnchorHref(normalizedMatchWord, allAnchors) ??
      getAnchorNextToUnsubscribe(normalizedMatchWord);
    // If an element was found, process the link
    if (unsubscribeLinkElement) {
      return processPotentialUnsubscribeLink(unsubscribeLinkElement.getAttribute('href'));
    }
  }

  return undefined;
};

/**
 * Get the unsubscribe mailto link or redirect link from the MIME or HTML of an email.
 * We parse out the unsubscribe information either from the email header (through the
 * 'List-unsubscribe' header) or from searching the HTML of the email body.
 * @param rawMimeContent
 * @param decryptedHtml
 * @returns
 */
export const getUnsubscribeLinks = (
  rawMimeContent: string,
  decryptedHtml: string | undefined,
  getSubjectBodyQueryParamsFromMailTo?: (queryString: string) => SubjectBodyQueryParams
): UnsubscribeLinks | undefined => {
  return (
    getUnsubscribeLinksFromHeaders(rawMimeContent, getSubjectBodyQueryParamsFromMailTo) ??
    getUnsubscribeLinksFromAnchorTag(decryptedHtml)
  );
};
