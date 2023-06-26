"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContentSnippet = exports.removeAllWhitespace = exports.sanitizeURL = exports.trimAndLowercase = void 0;
const constants_1 = require("./constants");
const invalidProtocolRegex = /^([^\w]*)(javascript|data|vbscript)/im;
const htmlEntitiesRegex = /&#(\w+)(^\w|;)?/g;
const ctrlCharactersRegex = /[\u0000-\u001F\u007F-\u009F\u2000-\u200D\uFEFF]/gim;
const urlSchemeRegex = /^([^:]+):/gm;
const relativeFirstCharacters = ['.', '/'];
function isRelativeUrlWithoutProtocol(url) {
    return relativeFirstCharacters.indexOf(url[0]) > -1;
}
// adapted from https://stackoverflow.com/a/29824550/2601552
function decodeHtmlCharacters(str) {
    return str.replace(htmlEntitiesRegex, (_, dec) => String.fromCharCode(dec));
}
function trimAndLowercase(str) {
    return str.trim().toLowerCase();
}
exports.trimAndLowercase = trimAndLowercase;
const sanitizeURL = (url) => {
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
exports.sanitizeURL = sanitizeURL;
const removeAllWhitespace = (str) => {
    return str.replace(/\s+/g, '');
};
exports.removeAllWhitespace = removeAllWhitespace;
/**
 * Creates a short snippet of the content to be displayed in the email. For now, we just substring, but
 * we could explore more complex logic in the future.
 * @param content Content to snippet
 * @returns Snippet of content
 */
function getContentSnippet(content) {
    return content.substring(0, constants_1.CONTENT_SNIPPET_SIZE);
}
exports.getContentSnippet = getContentSnippet;
//# sourceMappingURL=stringUtils.js.map