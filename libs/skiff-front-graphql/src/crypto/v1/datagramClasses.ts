/* eslint-disable max-classes-per-file */

import { fromByteArray, toByteArray } from 'base64-js';
import { gunzipSync, gzipSync } from 'fflate';
import { Range } from 'semver';
import { Datagram, createJSONWrapperDatagram, createUint8ArrayDatagram } from 'skiff-crypto';
import { utf8BytesToString, utf8StringToBytes } from 'skiff-utils';

/**
 * The link session key stores the encrypted copy of the document session key
 * for a document link.
 */
export const LinkSessionKeyDatagram = createJSONWrapperDatagram<string>('ddl://skiff/LinkSessionKeyDatagram');

/**
 * The link private hierarchical key stores the encrypted copy of the document private hierarchical key
 * for a document link, encrypted with the document kinkKey.
 */
export const LinkPrivateHierarchicalKeyDatagram = createJSONWrapperDatagram<string>(
  'ddl://skiff/LinkPrivateHierarchicalKeyDatagram'
);

/**
 * DocumentDataDatagram encapsulates the end-to-end encrypted data stored inside a
 * password-protected document. This supports the old 0.1.0 version. This also handle Richtext docs and uploaded to cache PDF.
 * For richtext doc, the content is a binary buffer representing the document state, for a uploaded to cache PDF, the content
 * is a JSON stringified string.
 */
export const DocumentDataDatagram: Datagram<string> = {
  type: 'ddl://skiff/DocumentDataDatagram',
  version: '0.2.0',
  versionConstraint: new Range('0.*.*'),
  serialize(data) {
    try {
      JSON.parse(data);
      return utf8StringToBytes(data);
    } catch {
      return gzipSync(toByteArray(data));
    }
  },
  deserialize(data, version) {
    if (version === '0.1.0') {
      // Data can be 2 things: a JSON object for a uploaded-to-cache PDF or a Hex encoded string for a rich text document
      // we have no way other than trying to parse the data to know its type
      const parsedData = JSON.parse(utf8BytesToString(data)).data;
      try {
        JSON.parse(parsedData); // if this throw, it means that the data is not a JSON string, so it's a rich text doc
        return parsedData;
      } catch {
        // legacy version (0.1.0) with JSONWrapper not compressed, hex encoded
        return fromByteArray(Buffer.from(JSON.parse(utf8BytesToString(data)).data, 'hex'));
      }
    }
    // we check if it's a PDF or a RichText doc
    try {
      const dataString = utf8BytesToString(data);
      JSON.parse(dataString); // will throw if its a rich text doc
      return dataString;
    } catch {
      // new version (0.2.0) without JSONWrapper and gzip compressed, base64 encoded
      return fromByteArray(gunzipSync(data));
    }
  }
};

/**
 * The link key follows the URL hash in an end-to-end encrypted document link.
 */
export const LinkLinkKeyDatagram = createJSONWrapperDatagram<string>('ddl://skiff/LinkLinkKeyDatagram');

/**
 * A cache element is inlined inside document contents or data.
 */
export const RawRichTextMediaCacheDatagram = createUint8ArrayDatagram('ddl://skiff/RichTextMediaRawDatagram');
