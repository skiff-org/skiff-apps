// eslint-disable-next-line max-classes-per-file
import { ChaCha20Poly1305, NONCE_LENGTH } from '@stablelib/chacha20poly1305';
import randomBytes from 'randombytes';

import { AADMeta, Datagram, Envelope, TypedBytes } from './common';
import { concatUint8Arrays } from './typedArraysUtils';

/**
 * TaggedSecretBox is an implementation of nacl.secretbox, but additionally includes the version and type information
 * of the encrypted content in the AD headers.
 */
export class TaggedSecretBox implements Envelope<any> {
  private readonly key: ChaCha20Poly1305;

  constructor(keyBytes: Uint8Array) {
    this.key = new ChaCha20Poly1305(keyBytes);
  }

  encrypt<T>(datagram: Datagram<T>, data: T, nonce: Uint8Array = randomBytes(NONCE_LENGTH)): TypedBytes {
    const aad: AADMeta = new AADMeta(datagram.version, datagram.type, nonce);
    const aadSerialized = aad.serialize();

    return new TypedBytes(
      concatUint8Arrays(aadSerialized, this.key.seal(nonce, datagram.serialize(data), aadSerialized))
    );
  }

  decrypt<T>(datagram: Datagram<T>, bytes: TypedBytes): T {
    const header = AADMeta.deserialize(bytes);
    if (header === null || header.metadata === null) {
      throw new Error("Couldn't decrypt: no header in provided data");
    }
    const decrypted: Uint8Array | null = this.key.open(header.metadata.nonce, header.content, header.rawMetadata);
    if (!decrypted) {
      throw new Error("Couldn't decrypt: invalid key");
    }

    if (datagram.type !== header.metadata.type) {
      throw new Error(
        `Couldn't decrypt: encrypted type (${header.metadata.type}) doesnt match datagram type (${datagram.type})`
      );
    }

    if (!datagram.versionConstraint.test(header.metadata.version)) {
      throw new Error(
        `Couldn't decrypt: encrypted version (${
          header.metadata.version
        }) doesnt match datagram version constraint (${datagram.versionConstraint.format()})`
      );
    }

    return datagram.deserialize(decrypted, header.metadata.version);
  }
}
