import { CONTENT_SNIPPET_SIZE } from './constants';

const invalidProtocolRegex = /^([^\w]*)(javascript|data|vbscript)/im;
const htmlEntitiesRegex = /&#(\w+)(^\w|;)?/g;
const ctrlCharactersRegex = /[\u0000-\u001F\u007F-\u009F\u2000-\u200D\uFEFF]/gim;
const urlSchemeRegex = /^([^:]+):/gm;
const relativeFirstCharacters = ['.', '/'];

function isRelativeUrlWithoutProtocol(url: string): boolean {
  return relativeFirstCharacters.indexOf(url[0]) > -1;
}

// adapted from https://stackoverflow.com/a/29824550/2601552
function decodeHtmlCharacters(str: string) {
  return str.replace(htmlEntitiesRegex, (_, dec: number) => String.fromCharCode(dec));
}

export function trimAndLowercase(str: string) {
  return str.trim().toLowerCase();
}

export const sanitizeURL = (url?: string | null): string => {
  const sanitizedUrl = decodeHtmlCharacters(url || '')
    .replace(ctrlCharactersRegex, '')
    .trim();

  const emptyPage = 'about:blank';

  if (!sanitizedUrl) {
    return emptyPage;
  }

  if (isRelativeUrlWithoutProtocol(sanitizedUrl)) {
    return sanitizedUrl;
  }

  if (!sanitizedUrl.match(/^https?:\/\//i)) {
    // Add https protocol in case it without. example: google.com
    return 'https://' + sanitizedUrl;
  }

  const urlSchemeParseResults = sanitizedUrl.match(urlSchemeRegex);

  if (!urlSchemeParseResults) {
    return sanitizedUrl;
  }

  const urlScheme = urlSchemeParseResults[0];

  if (invalidProtocolRegex.test(urlScheme)) {
    return emptyPage;
  }

  return sanitizedUrl;
};

export const removeAllWhitespace = (str: string) => {
  return str.replace(/\s+/g, '');
};

/**
 * Creates a short snippet of the content to be displayed in the email. For now, we just substring, but
 * we could explore more complex logic in the future.
 * @param content Content to snippet
 * @returns Snippet of content
 */
export function getContentSnippet(content: string): string {
  return content.substring(0, CONTENT_SNIPPET_SIZE);
}
