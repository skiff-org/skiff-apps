import parse from 'style-to-object';

import { getEnvironment } from './envUtils';

export const PLACEHOLDER_CONTENT_URL = '/mail/.well-known/image-shield.svg';

export const getResourceProxyURL = (originUrl: URL, disableRemoteContent: boolean): URL => {
  // if remote content disabled, return placeholder
  if (disableRemoteContent) {
    return new URL(window.location.origin + PLACEHOLDER_CONTENT_URL);
  }

  const proxyURL = getBaseProxyURL(originUrl);
  return new URL('/image_proxy/?', proxyURL);
};

export const getBaseProxyURL = (originUrl: URL): URL => {
  const env = getEnvironment(originUrl);
  switch (env) {
    case 'local':
      return new URL('http://localhost:9999');
    case 'development':
    case 'vercel':
      return new URL('https://resource-proxy.skiff.town');
    case 'staging':
      return new URL('https://resource-proxy.skiff.city');
    case 'production':
      return new URL('https://resource-proxy.skiff.com');
    default:
      throw Error('Unknown NODE_ENV used');
  }
};

const isValidRewriteURL = (link: string): boolean => {
  try {
    const url = new URL(link);
    // Do not rewrite a CID
    const isValidCID = url.protocol === 'cid:';

    // Do not write data images
    const isValidData = url.protocol === 'data:';
    const isValidBlob = url.protocol === 'blob:';
    return !(isValidCID || isValidData || isValidBlob);
  } catch (e) {
    return false;
  }
  // TODO: disallow localhost, internal IP addresses
  // TODO: check if malware-y or spoofing site
};

export const getNewLink = (link: string, originUrl: URL, disableRemoteContent: boolean): URL => {
  const redirHost = getResourceProxyURL(originUrl, disableRemoteContent);
  redirHost.searchParams.set('url', link);
  return redirHost;
};

const rewrittenAttributes = [
  ['', 'src'],
  ['img', 'href'],
  ['img', 'srcset'],
  ['image', 'href'],
  ['image', 'xlink\\:href'],
  ['table', 'background'],
  ['td', 'background'],
  ['video', 'poster']
] as [string, string][];

/**
 * Rewrites all attributes that contain links to external sites to use resource proxy, leaving the original
 * value as "data-raw-<attribute>" in the element
 * @param dom
 * @returns
 */
export const proxyAttributes = (dom: Document, disableRemoteContent: boolean) => {
  let numProxy = 0;
  const originUrl: URL = new URL(window.location.origin);
  rewrittenAttributes.forEach(([tag, attribute]) => {
    dom.querySelectorAll(`${tag}[${attribute}]`).forEach((el) => {
      const val = el.getAttribute(attribute);
      if (val && isValidRewriteURL(val)) {
        el.setAttribute(`data-raw-${attribute}`, val);
        const rewrittenURL = getResourceProxyURL(originUrl, disableRemoteContent);
        numProxy += 1;
        // the resource proxy URL must have query param AND url variable set to the same image
        if (disableRemoteContent) {
          rewrittenURL.searchParams.set('url', PLACEHOLDER_CONTENT_URL);
        } else {
          rewrittenURL.searchParams.set('url', val);
        }
        el.setAttribute(attribute, rewrittenURL.toString());
      }
    });
  });
  return { dom, numProxy };
};

/**
 * Restores the proxied attributes from the "data-raw-<attribute>" attributes
 * @param dom
 * @returns
 */
export const restoreAttributes = (dom: Document) => {
  rewrittenAttributes.forEach(([tag, attribute]) => {
    dom.querySelectorAll(`${tag}[data-raw-${attribute}]`).forEach((el) => {
      const val = el.getAttribute(`data-raw-${attribute}`);
      if (val) {
        el.setAttribute(attribute, val);
      }
    });
  });
  return dom;
};

/** CSS */

const CSS_URL_REGEX = /url\(\s?'(\S*)'\s?\)|url\(\s?"(\S*)"\s?\)|url\(\s?(\S*)\s?\)/g;

const getUrlMatches = (text: string): string[] => {
  const urls: string[] = [];
  // Regex derived from RFC in https://www.w3.org/TR/CSS21/syndata.html#uri
  const linkMatches = text.matchAll(CSS_URL_REGEX);
  for (const links of linkMatches) {
    const link = links[1] || links[2] || links[3];
    urls.push(link);
  }
  return urls;
};

/**
 * Rewrites all url() properties in styles proxying them instead relative to originUrl
 * @param document
 * @param originUrl
 */
export const rewriteCSSAttribute = (document: Document, originUrl: URL, disableRemoteContent: boolean): void => {
  const nodesWithCss = document.querySelectorAll('[style]');
  const cssNodes = document.querySelectorAll('style, svg');

  // Rewrite style attribute on nodes
  nodesWithCss.forEach((node) => {
    let css = node.getAttribute('style');
    if (css) {
      const cssURLs: string[] = [];
      // Find all links
      try {
        parse(css, function (_name, value, _declaration) {
          const links = getUrlMatches(value).filter(isValidRewriteURL);
          cssURLs.push(...links);
        });
      } catch (error) {
        console.error('Failed to parse css for url rewrite', css);
      }
      // Replace all links
      cssURLs.forEach((link) => {
        const newLink = getNewLink(link, originUrl, disableRemoteContent);
        if (css) {
          css = css.replace(link, newLink.toString());
        }
      });
      // Write back the style attribute
      node.setAttribute('style', css);
    }
  });

  // Rewrite inner HTML of style nodes
  cssNodes.forEach((node) => {
    let innerHTML = node.innerHTML;
    let cssURLs: string[] = [];
    try {
      cssURLs = getUrlMatches(innerHTML);
    } catch (error) {
      console.log('Failed to get url matches: ', innerHTML);
    }
    // Replace all links
    cssURLs.forEach((link) => {
      const newLink = getNewLink(link, originUrl, disableRemoteContent);
      innerHTML = innerHTML.replace(link, newLink.toString());
    });
    // Write back the new html
    // eslint-disable-next-line no-unsanitized/property
    node.innerHTML = innerHTML;
  });
};
