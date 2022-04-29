import { RefObject } from 'react';

const INJECTED_ID_ATTR = 'data-injected-id';

export enum InjectedIDs {
  LastEmailQuote = 'last-email-quote',
  ShowPreviousContainer = 'show-last-container',
  CIDImage = 'cid-image'
}

export const findInjectedNode = (dom: Document, injectedID: InjectedIDs) =>
  dom.querySelector(`[${INJECTED_ID_ATTR}=${injectedID}]`);

export const findInjectedNodes = (dom: Document, injectedID: InjectedIDs) =>
  Array.from(dom.querySelectorAll(`[${INJECTED_ID_ATTR}=${injectedID}]`));

export const findInjectedNodesInIframe = (iframe: RefObject<HTMLIFrameElement>, injectedID: InjectedIDs) =>
  iframe.current?.contentWindow?.document && findInjectedNodes(iframe.current?.contentWindow?.document, injectedID);

export const findInjectedNodeInIframe = (iframe: RefObject<HTMLIFrameElement>, injectedID: InjectedIDs) =>
  iframe.current?.contentWindow?.document && findInjectedNode(iframe.current?.contentWindow?.document, injectedID);

const markEmailBlockquote = (dom: Document) => {
  const parsers: ((dom: Document) => Element | null)[] = [
    // Skiff
    (d) => d.querySelector('blockquote[data-skiff-mail]'),
    // 1st Gmail
    (d) => d.querySelector('div.gmail_quote'),
    // 2nd Gmail
    // (d) => d.querySelector('div.3D"gmail_quote"'),
    // Proton
    (d) => d.querySelector('blockquote.protonmail_quote'),
    // Tutanota
    (d) => d.querySelector('blockquote.tutanota_quote'),
    // Yahoo
    (d) => d.querySelector('div.yahoo_quoted'),
    // Outlook
    (d) => d.querySelector('div[id="3D\\"divRplyFwdMsg\\""]')
  ];

  let quote;
  for (const parser of parsers) {
    quote = parser(dom);
    if (quote) {
      quote.setAttribute(INJECTED_ID_ATTR, InjectedIDs.LastEmailQuote);
      break;
    }
  }
};

const injectShowPreviousContainer = (dom: Document) => {
  const quote = findInjectedNode(dom, InjectedIDs.LastEmailQuote);
  if (quote) {
    const div = document.createElement('div');
    div.setAttribute(INJECTED_ID_ATTR, InjectedIDs.ShowPreviousContainer);
    quote.parentElement?.insertBefore(div, quote);
  }
};

const markCidImages = (dom: Document) => {
  const images = dom.querySelectorAll('img');
  Array.from(images).forEach((img) => {
    const src = img.getAttribute('src');
    if (!src || !src.includes('cid')) return;

    // get string after cid:[string]
    const cid = src.match(/cid:(.*)/)?.[1];
    if (!cid) return;

    img.setAttribute(INJECTED_ID_ATTR, InjectedIDs.CIDImage);
  });
};

/**
 * This util is used to inject any custom skiff marking into the html,
 * so it can be referenced later.
 * This is also used to inject containers to later portal with react,
 * useful if we want to add custom options on the plain html.
 *
 * Example:
 *
 * we mark the <blockquote data-skiff-mail>
 * and append a container
 * to later enable email quote folding
 */
export const injectIDs = (html) => {
  const dom = document.implementation.createHTMLDocument();
  dom.body.innerHTML = html;

  markEmailBlockquote(dom);
  injectShowPreviousContainer(dom);
  markCidImages(dom);

  return dom.body.innerHTML;
};
