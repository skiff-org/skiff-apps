import isEmail from 'validator/lib/isEmail';

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
  return str.replace(htmlEntitiesRegex, (match, dec) => String.fromCharCode(dec));
}

const sanitizeURL = (url?: string | null): string => {
  const sanitizedUrl = decodeHtmlCharacters(url || '')
    .replace(ctrlCharactersRegex, '')
    .trim();

  if (!sanitizedUrl) {
    return 'about:blank';
  }

  // Check if it's a valid email address. This regex is a simple one.
  if (isEmail(sanitizedUrl)) {
    return `mailto:${sanitizedUrl}`;
  }

  // Handle mailto URLs
  if (sanitizedUrl.startsWith('mailto:')) {
    return sanitizedUrl;
  }

  if (isRelativeUrlWithoutProtocol(sanitizedUrl)) {
    return sanitizedUrl;
  }

  if (!sanitizedUrl.match(/^https?:\/\//i) && !sanitizedUrl.match(/^mailto:/i)) {
    // Add https protocol in case it without. example: google.com
    return 'https://' + sanitizedUrl;
  }

  const urlSchemeParseResults = sanitizedUrl.match(urlSchemeRegex);

  if (!urlSchemeParseResults) {
    return sanitizedUrl;
  }

  const urlScheme = urlSchemeParseResults[0];

  if (invalidProtocolRegex.test(urlScheme)) {
    return 'about:blank';
  }

  return sanitizedUrl;
};

export default sanitizeURL;
