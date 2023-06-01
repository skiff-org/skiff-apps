// eslint-disable-next-line max-classes-per-file
import { Range } from 'semver';
import { utf8BytesToString, utf8StringToBytes } from '../utf8';

import { concatUint8Arrays, extractVarintPrefixed, varintPrefixed } from './typedArraysUtils';

interface Typed {
  type: string;
}

interface Versioned {
  version: string;
  versionConstraint: Range;
}

interface Serializable<T> {
  serialize(data: T): Uint8Array;
}

interface Deserializable<T> {
  deserialize(data: Uint8Array, version: string): T;
}

// Datagram is the minimum set of functions needed to serialize and deserialize a typed and versioned object.
export type Datagram<T> = Typed & Versioned & Serializable<T> & Deserializable<T>;

interface EncryptDatagram<T> {
  encrypt(datagram: Datagram<T>, data: T, nonce: Uint8Array): TypedBytes;
}

interface DecryptDatagram<T> {
  decrypt(datagram: Datagram<T>, bytes: TypedBytes): T;
}

// Envelope is the minimum set of functions needed to encrypt and decrypt a bytestream.
export type Envelope<T> = EncryptDatagram<T> & DecryptDatagram<T>;

/**
 * AADMeta is a class that encapsulates the additional metadata included in these envelope implementations.
 */
export class AADMeta {
  constructor(readonly version: string, readonly type: string, readonly nonce: Uint8Array) {}

  static deserialize(data: Uint8Array): {
    metadata: AADMeta;
    rawMetadata: Uint8Array;
    content: Uint8Array;
  } | null {
    const header = extractVarintPrefixed({ bs: data.copyWithin(0, 0) });

    const rawMetadata = varintPrefixed(header);
    const content = data.slice(rawMetadata.length);

    const headerBuf = { bs: header.copyWithin(0, 0) };

    const metadataVersion = utf8BytesToString(extractVarintPrefixed(headerBuf));
    if (metadataVersion !== AADMeta.METADATA_VERSION) {
      throw new Error('unrecognized metadata version');
    }
    const metadata = new AADMeta(
      utf8BytesToString(extractVarintPrefixed(headerBuf)),
      utf8BytesToString(extractVarintPrefixed(headerBuf)),
      extractVarintPrefixed(headerBuf)
    );

    if (headerBuf.bs.length !== 0) {
      throw new Error('unexpected additional content in header');
    }

    return {
      metadata,
      rawMetadata,
      content
    };
  }

  static readonly METADATA_VERSION = '0.1.0';

  serialize(): Uint8Array {
    /**
     * A serialized AAD header contains four pieces of information:
     *   version of the metadata format
     *   version of the encrypted object
     *   type name of the encrypted object
     *   nonce used for the encryption scheme
     *
     * It is composed of several varint-prefixed Uint8Arrays, which is then itself expressed as a
     * varint-prefixed byte array.
     *
     * It looks like this on the wire:
     *   NNxxxxxxxxxxxxxxxxxxxxxxxxx...
     *     AAxx...BBxx...CCxx...DDxx...
     *
     *   where AA, BB, CC, DD, and NN are varint-encoded (1-10 bytes long) and express the number of bytes following
     *   that indicator which comprise that field.
     *
     *   AAxxx is the prefixed metadata format version
     *   BBxxx is the prefixed object version
     *   CCxxx is the prefixed typename
     *   DDxxx is the prefixed nonce. Length is prefixed instead of static to allow for multiple envelope types.
     *
     *   and NNxxx is the prefixed length of those four strings concatenated together.
     *
     */
    const data: Uint8Array = concatUint8Arrays(
      varintPrefixed(utf8StringToBytes(AADMeta.METADATA_VERSION)),
      varintPrefixed(utf8StringToBytes(this.version)),
      varintPrefixed(utf8StringToBytes(this.type)),
      varintPrefixed(this.nonce)
    );

    return varintPrefixed(data);
  }
}

/** TypedBytes is a simple extension of a Uint8Array. It introduces a function that lets us inspect the header metadata.
 *
 * If the content being provided doesn't have the associated header, nonsense may be returned.
 */
export class TypedBytes extends Uint8Array {
  inspect(): ReturnType<typeof AADMeta['deserialize']> {
    const parsed = AADMeta.deserialize(this);

    if (parsed == null || parsed.metadata == null) {
      return null;
    }

    return parsed;
  }
}
