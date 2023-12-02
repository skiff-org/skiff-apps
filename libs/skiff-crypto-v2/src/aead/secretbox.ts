import { randomBytes } from 'crypto';

import { ChaCha20Poly1305, NONCE_LENGTH } from '@stablelib/chacha20poly1305';

import {
  AADMeta,
  Datagram,
  deserializeAADMeta as deserializeAADMeta,
  Envelope,
  serializeAADMeta as serializeAADMeta,
  TypedBytes
} from './common';
import { concatUint8Arrays } from './typedArraysUtils';

/**
 * TaggedSecretBox is an implementation of nacl.secretbox, but additionally includes the version and type information
 * of the encrypted content in the AD headers.
 */
class TaggedSecretBox implements Envelope<any, any> {
  private readonly key: ChaCha20Poly1305;

  constructor(keyBytes: Uint8Array) {
    this.key = new ChaCha20Poly1305(keyBytes);
  }

  encrypt<Header, Body>(datagram: Datagram<Header, Body>, header: Header, data: Body): TypedBytes {
    const nonce = randomBytes(NONCE_LENGTH);
    const aad: AADMeta = {
      datagramVersion: datagram.version,
      datagramType: datagram.type,
      nonce,
      rawHeader: datagram.serializeHeader(header, datagram.version)
    };
    const aadSerialized = serializeAADMeta(aad);

    return new TypedBytes(
      concatUint8Arrays(
        aadSerialized,
        this.key.seal(nonce, datagram.serializeBody(data, datagram.version), aadSerialized)
      )
    );
  }

  decrypt<Header, Body>(
    datagram: Datagram<Header, Body>,
    bytes: TypedBytes
  ): { metadata: AADMeta; header: Header; body: Body } {
    const parsedMetadata = deserializeAADMeta(bytes);
    if (parsedMetadata === null || parsedMetadata.metadata === null) {
      throw new Error("Couldn't decrypt: no header in provided data");
    }
    const decrypted: Uint8Array | null = this.key.open(
      parsedMetadata.metadata.nonce,
      parsedMetadata.content,
      parsedMetadata.rawMetadata
    );
    if (!decrypted) {
      throw new Error("Couldn't decrypt: invalid key");
    }

    if (datagram.type !== parsedMetadata.metadata.datagramType) {
      throw new Error(
        `Couldn't decrypt: encrypted type (${parsedMetadata.metadata.datagramType}) doesnt match datagram type (${datagram.type})`
      );
    }

    if (!datagram.versionConstraint.test(parsedMetadata.metadata.datagramVersion)) {
      throw new Error(
        `Couldn't decrypt: encrypted version (${
          parsedMetadata.metadata.datagramVersion
        }) doesnt match datagram version constraint (${datagram.versionConstraint.format()})`
      );
    }

    return {
      metadata: parsedMetadata.metadata,
      header: datagram.deserializeHeader(parsedMetadata.metadata.rawHeader, parsedMetadata.metadata.datagramVersion),
      body: datagram.deserializeBody(decrypted, parsedMetadata.metadata.datagramVersion)
    };
  }
}

export default TaggedSecretBox;
