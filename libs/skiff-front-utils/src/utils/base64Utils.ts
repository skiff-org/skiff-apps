export type DataUrl = string;
export type Base64 = string;

export const base64RegExp = new RegExp(/^[a-zA-Z0-9+\/]*={0,3}$/);
export const dataUrlRegExp = new RegExp(/data:(?<mime>[\w\/\-\+\.]+)(?<encoding>;base64),(?<data>.*)/);

/**
 * Checks if a given string is a valid base64
 * @param str string to validate
 * @returns check result
 */
export function isBase64(str: string): boolean {
  return str.length % 4 === 0 && base64RegExp.test(str);
}

export function mimeTypeFromDataUrl(dataUrl: DataUrl): null | string {
  const match = dataUrl.match(dataUrlRegExp);
  if (!match) return null;

  const [, mimeType] = match;
  return mimeType;
}

/**
 * Checks if a given string is a valid DataUrl
 * @param str string to validate
 * @returns check result
 */
export function isDataUrl(str: string): boolean {
  const match = str.match(dataUrlRegExp);
  if (!match) return false;

  const [, , encoding, data] = match;

  const isDataWellEncoded = encoding ? isBase64(data) : true;

  return isDataWellEncoded;
}

/**
 * Encodes given string to base 64
 * @param str string to encode
 * @returns given string encoded as base64 string
 */
export function encodeAsBase64(str: string) {
  return window.btoa(str);
}

/**
 * Gets a Base64 or DataUrl content, extracts, converts and returns it's base64 encoded content
 * @param content string representation of content
 * @param convert if content needs a base64 conversion
 * @returns the base64 encoded part of the given content
 */
export function contentAsBase64(content: Base64 | DataUrl, convert = false): Base64 {
  if (isDataUrl(content)) {
    const dataPart = content.split(',')[1];

    if (!convert) return dataPart;
    return encodeAsBase64(dataPart);
  }

  return content;
}

/**
 * Gets a Base64 or DataUrl content and returns it as a DataUrl encoded string
 * @param content the content to encode
 * @param mimeType the content MIME type
 * @returns content encoded as a dataUrl
 */
export function contentAsDataUrl(content: Base64 | DataUrl, mimeType: string): DataUrl {
  if (isDataUrl(content)) return content;
  return `data:${mimeType};base64,${content}`;
}
