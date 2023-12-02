import {
  KeyID,
  Message,
  PrivateKey,
  PublicKey,
  createMessage,
  decrypt,
  encrypt,
  enums as pgpconstants,
  readMessage
} from 'openpgp';

export type PGPUser = {
  name: string | undefined;
  email: string | undefined;
};

export type SenderPGPInfo = PGPUser & {
  privateKey: PrivateKey;
  keyID: KeyID;
};

export type RecipientPGPInfo = PGPUser & {
  publicKey: PublicKey;
  keyID: KeyID;
};

export async function encryptMessage(
  binary: Uint8Array | ReadableStream,
  sender: SenderPGPInfo,
  recipients: RecipientPGPInfo[]
) {
  const recipientPublicKeys = recipients.map((recipient) => recipient.publicKey); // pass the main key
  const recipientKeyIDs = await Promise.all(recipients.map(async (recipient) => {
    // validate that the keyID is an actual encryption key
    const key = await recipient.publicKey.getEncryptionKey(recipient.keyID);
    return key.getKeyID();
  }));
  const recipientUserInfo = recipients.map((recipient) => {
    return { name: recipient.name, email: recipient.email };
  });

  const message = await createMessage({ binary });

  const senderSigningKey = await sender.privateKey.getSigningKey(sender.keyID);

  const encryptedStream = await encrypt({
    message,
    encryptionKeys: recipientPublicKeys,
    encryptionKeyIDs: recipientKeyIDs,
    encryptionUserIDs: recipientUserInfo,
    signingKeys: sender.privateKey,
    signingKeyIDs: senderSigningKey.getKeyID(),
    signingUserIDs: { name: sender.name, email: sender.email },
    format: 'armored',
    config: { preferredCompressionAlgorithm: pgpconstants.compression.zlib }
  });

  return encryptedStream;
}

export async function getStringFromStream(message: ReadableStream<string>) {
  // async iterators for ReadableStream is not yet widely supported

  let encryptedResultText = '';
  const reader = message.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) return encryptedResultText;
    encryptedResultText += value;
  }
}

export async function parseEncryptedMessage(encryptedText: string) {
  // Get encrypted message text
  const encryptedMessage = await readMessage({
    armoredMessage: encryptedText // parse encrypted bytes
  });

  return { encryptedMessage, encryptedKeyIDs: encryptedMessage.getEncryptionKeyIDs() };
}

export async function decryptMessage(
  message: Message<string>,
  senderPublicKey: PublicKey,
  recipientPrivateKey: PrivateKey
) {
  // TODO: pass in detached signatures
  // TODO: pass in date based on sent timestamp
  const { data: decrypted, signatures } = await decrypt({
    message,
    verificationKeys: senderPublicKey, // optional
    decryptionKeys: [recipientPrivateKey]
  });

  // TODO: handle encrypted but not signed messages
  try {
    // verified throws if it does not verify
    await Promise.all(signatures.map((signature) => signature.verified));
    return { decrypted, signatures, signatureVerified: true };
  } catch (e) {
    console.log('Signature could not be verified:');
    return { decrypted, signatures, signatureVerified: false };
  }
}
