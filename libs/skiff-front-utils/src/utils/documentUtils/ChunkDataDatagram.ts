import { fromByteArray, toByteArray } from 'base64-js';
import { gunzipSync, gzipSync } from 'fflate';
import { Range } from 'semver';
import { Datagram } from 'skiff-crypto';
import { utf8BytesToString, utf8StringToBytes } from 'skiff-utils';
import isHexadecimal from 'validator/lib/isHexadecimal';

import { ChunkData } from '../../types';

/**
 * ChunkDataDatagram encapsulates the end-to-end encrypted data stored inside
 * an encrypted chunk.
 */
export const ChunkDataDatagram: Datagram<ChunkData> = {
  type: 'ddl://skiff/ChunkDataDatagram',
  version: '0.2.0',
  versionConstraint: new Range('0.*.*'),
  serialize(data) {
    return utf8StringToBytes(
      JSON.stringify({
        ...data,
        // if document is a pdf uploaded to cache, we don't compress it
        documentData:
          data.hasPassword || ('uploadedToCache' in data && data.uploadedToCache)
            ? data.documentData // this is compressed by DocumentDataDatagram as we can't compress encrypted data
            : fromByteArray(gzipSync(toByteArray(data.documentData)))
      })
    );
  },
  deserialize(data, version) {
    if (version === '0.1.0') {
      // Legacy JSONWrapper: documentData not compressed, hex encoded
      const decoded = JSON.parse(utf8BytesToString(data)) as { data: ChunkData };
      let decodedDocumentData: string;
      if (decoded.data.hasPassword || ('uploadedToCache' in decoded.data && decoded.data.uploadedToCache)) {
        // cached file or will be decrypted with password later
        decodedDocumentData = decoded.data.documentData;
      } else if (!isHexadecimal(decoded.data.documentData)) {
        // error case - data is not hex encoded
        // in the doc case, this is likely a version mismatch containing a b64 string
        // in the PDF case, this is likely a raw PDF string
        console.error('chunkData b64 decoded data');
        decodedDocumentData = decoded.data.documentData;
      } else {
        // 0.1.0 version document - encoded as hex string
        decodedDocumentData = fromByteArray(Buffer.from(decoded.data.documentData, 'hex'));
      }
      return {
        ...decoded.data,
        documentData: decodedDocumentData
      };
    }
    // New ChunkDataDatagram: documentData base64 encoded, compressed if not password protected
    const decoded = JSON.parse(utf8BytesToString(data)) as ChunkData;
    return {
      ...decoded,
      // if document is uploaded to cache, its documentData field is not compressed
      documentData:
        decoded.hasPassword || ('uploadedToCache' in decoded && decoded.uploadedToCache)
          ? decoded.documentData // will be decompressed by DocumentDataDatagram after decryption
          : fromByteArray(gunzipSync(toByteArray(decoded.documentData)))
    };
  }
};
