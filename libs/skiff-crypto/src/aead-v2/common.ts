// This file provides interface definitions for the AEAD library that is used for encryption and decryption
// Skiff data.
//
// Datagram:
// The Datagram interface specifies the minimum set of functions needed to serialize and deserialize a typed and versioned object.
// A Datagram is composed of two parts - a header and a body that are individually typed and can be seperately serialized/deserialized.
// - Body: The datagram body should data intended to be encrypted/decrypted.
// - Header: The datagram header should contain unencrypted data that should be included alongside the encrypted body.
//
// AADMeta:
// The AADMeta structure is used to store the datagram header alonside other metadata necessary for encryption and
// backwards compatibility. The serialized datagram header is stored in the 'header' field of the AADMeta.
//
// Envelope:
// The Envelope interface specifies the set of functions needed to encrypt/decrypt a datagram.
// Currently, Skiff maintains a single general implementation of the Envelope interface suitable for any datagram,
// and located in `secretbox.ts`.

import { Range } from 'semver';
import { utf8BytesToString, utf8StringToBytes } from 'skiff-utils';

import { concatUint8Arrays, extractVarintPrefixed, varintPrefixed } from '../aead/typedArraysUtils';

interface Typed {
  type: string;
}

interface Versioned {
  version: string;
  versionConstraint: Range;
}

interface Serializable<Header, Body> {
  serializeHeader(data: Header, version: string): Uint8Array;
  serializeBody(data: Body, version: string): Uint8Array;
}

interface Deserializable<Header, Body> {
  deserializeHeader(bytes: Uint8Array, version: string): Header;
  deserializeBody(bytes: Uint8Array, version: string): Body;
}

// Datagram is the minimum set of functions needed to serialize and deserialize a typed and versioned object.
export type DatagramV2<Header, Body> = Typed & Versioned & Serializable<Header, Body> & Deserializable<Header, Body>;
interface EncryptDatagram<Header, Body> {
  encrypt(datagram: DatagramV2<Header, Body>, header: Header, data: Body): TypedBytesV2;
}

interface decryptDatagramV2<Header, Body> {
  decrypt(
    datagram: DatagramV2<Header, Body>,
    bytes: TypedBytesV2
  ): {
    metadata: AADMetaV2;
    header: Header;
    body: Body;
  };
}

// Envelope is the minimum set of functions needed to encrypt and decrypt a bytestream.
export type EnvelopeV2<Header, Body> = EncryptDatagram<Header, Body> & decryptDatagramV2<Header, Body>;

/**
 * AADMeta is a class that encapsulates the additional metadata included in these envelope implementations.
 */
const AAD_METADATA_VERSION = '0.2.0';
export interface AADMetaV2 {
  datagramVersion: string;
  datagramType: string;
  nonce: Uint8Array;
  rawHeader: Uint8Array;
}

export function deserializeAADMeta(data: TypedBytesV2): {
  metadata: AADMetaV2;
  rawMetadata: Uint8Array;
  content: Uint8Array;
} | null {
  const rawBytes = extractVarintPrefixed({ bs: data });
  const rawMetadata = varintPrefixed(rawBytes);
  const content = data.slice(rawMetadata.length);
  const metadataBuf = { bs: rawBytes };
  const metadataVersion = utf8BytesToString(extractVarintPrefixed(metadataBuf));
  if (metadataVersion !== AAD_METADATA_VERSION) {
    throw new Error('unrecognized metadata version');
  }
  const datagramVersion = utf8BytesToString(extractVarintPrefixed(metadataBuf));
  const datagramType = utf8BytesToString(extractVarintPrefixed(metadataBuf));
  const nonce = extractVarintPrefixed(metadataBuf);
  const rawHeader = extractVarintPrefixed(metadataBuf);

  const metadata: AADMetaV2 = {
    datagramVersion,
    datagramType,
    nonce,
    rawHeader
  };
  if (metadataBuf.bs.length !== 0) {
    throw new Error('unexpected additional content in header');
  }
  return {
    metadata,
    rawMetadata,
    content
  };
}

export function serializeAADMeta(metadata: AADMetaV2): Uint8Array {
  /**
   * A serialized AAD metadata object contains five pieces of information:
   *   version of the metadata format
   *   version of the encrypted object
   *   type name of the encrypted object
   *   nonce used for the encryption scheme
   *   arbitrary additional serialized metadata, for use by consumers
   *
   * It is composed of several varint-prefixed Uint8Arrays, which is then itself expressed as a
   * varint-prefixed byte array.
   *
   * It looks like this on the wire:
   *   NNxxxxxxxxxxxxxxxxxxxxxxxxx...
   *     AAxx...BBxx...CCxx...DDxx...EExx...
   *
   *   where AA, BB, CC, DD, EE, and NN are varint-encoded and express the number of bytes following
   *   that indicator which comprise that field.
   *
   *   AAxxx is the prefixed metadata format version
   *   BBxxx is the prefixed object version
   *   CCxxx is the prefixed typename
   *   DDxxx is the prefixed nonce. Length is prefixed instead of static to allow for multiple envelope types.
   *   EExxx is arbitrary additional header data specified by the datagram.
   *
   *   and NNxxx is the prefixed length of those four strings concatenated together.
   *
   */
  const data: Uint8Array = concatUint8Arrays(
    varintPrefixed(utf8StringToBytes(AAD_METADATA_VERSION)),
    varintPrefixed(utf8StringToBytes(metadata.datagramVersion)),
    varintPrefixed(utf8StringToBytes(metadata.datagramType)),
    varintPrefixed(metadata.nonce),
    varintPrefixed(metadata.rawHeader)
  );

  return varintPrefixed(data);
}

/** TypedBytes is a simple extension of a Uint8Array. It introduces a function that lets us inspect the metadata.
 *
 * If the content being provided doesn't have the associated metadata, nonsense may be returned.
 */
export class TypedBytesV2 extends Uint8Array {
  inspect(): AADMetaV2 | null {
    const parsed = deserializeAADMeta(this);

    if (parsed == null || parsed.metadata == null) {
      return null;
    }

    return parsed.metadata;
  }
}
