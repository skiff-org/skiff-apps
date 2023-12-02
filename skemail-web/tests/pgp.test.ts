import {
  decryptMessage,
  encryptMessage,
  exportPGPKey,
  generatePGPKey,
  getStringFromStream,
  parseEncryptedMessage,
  readPrivateKey,
  readPublicKey,
  verifyWKDHash
} from 'skiff-crypto-v2';

const USER_MESSAGE = 'This is PGP encrypted from purplehipporhino.';

describe('pgp', () => {
  it('does not error', async () => {
    const senderKeyData = await generatePGPKey(
      [
        {
          name: 'Purple Hippo Rhino',
          email: 'purplehipporhino@skiff.town'
        }
      ],
      'ecc',
      'curve25519'
    );

    const senderPrivateKey = await readPrivateKey(senderKeyData.privateKey);

    const keyText = await exportPGPKey(
      [
        {
          name: 'Nishil',
          email: 'nishil@skiff.town'
        }
      ],
      senderPrivateKey,
      senderKeyData.date
    );

    expect(keyText.privateKey).toContain('-----BEGIN PGP PRIVATE KEY BLOCK-----');
    expect(keyText.privateKey).toContain('-----END PGP PRIVATE KEY BLOCK-----');

    expect(keyText.publicKey).toContain('-----BEGIN PGP PUBLIC KEY BLOCK-----');
    expect(keyText.publicKey).toContain('-----END PGP PUBLIC KEY BLOCK-----');

    /**
     * ENCRYPT MESSAGE SECTION!!
     */
    const recipientKeyData = await generatePGPKey(
      [
        {
          name: 'Nishil',
          email: 'recipient@protonmail.com'
        }
      ],
      'ecc',
      'curve25519'
    );

    const recipientPublicKey = await readPublicKey(recipientKeyData.publicKey);

    const enc = new TextEncoder();
    const readableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(enc.encode(USER_MESSAGE));
        controller.close();
      }
    });

    const recipientKey = await recipientPublicKey.getEncryptionKey();
    const message = await encryptMessage(
      readableStream,
      {
        name: senderKeyData.userIDs[0]?.name ?? '',
        email: senderKeyData.userIDs[0]?.email ?? '',
        privateKey: senderPrivateKey,
        keyID: senderPrivateKey.getKeyID() // private signing key which is by default on the top level key
      },
      [
        {
          name: recipientKeyData.userIDs[0]?.name ?? '',
          email: recipientKeyData.userIDs[0]?.email ?? '',
          publicKey: recipientPublicKey,
          keyID: recipientKey.getKeyID() // public subkey that has encryption capabilities which by default is the subkey
        }
      ]
    );

    // @ts-expect-error(345)
    const encryptedText = await getStringFromStream(message);
    expect(encryptedText).toContain('-----BEGIN PGP MESSAGE-----');
    expect(encryptedText).toContain('-----END PGP MESSAGE-----');

    const { encryptedMessage, encryptedKeyIDs } = await parseEncryptedMessage(encryptedText);

    const recipientPrivateKey = await readPrivateKey(recipientKeyData.privateKey);
    const senderPublicKey = await readPublicKey(senderKeyData.publicKey);

    // Start of section to get the set of encrypted keys without needing to decrypt message. Used to track which key is used for which message
    const userKeyIDs = recipientPublicKey.getKeyIDs();
    expect(userKeyIDs.length).toEqual(2);
    expect(encryptedKeyIDs.length).toEqual(1);

    const userEncryptedWithKeyIDs = userKeyIDs.filter(
      (key) => !!encryptedKeyIDs.find((encryptedKeyID) => key.equals(encryptedKeyID))
    );

    expect(userEncryptedWithKeyIDs[0]).toBeDefined();

    if (!userEncryptedWithKeyIDs[0]) {
      console.log('userEncryptedWithKeyIDs length: ' + userEncryptedWithKeyIDs.length.toString());
      throw Error('message was not encrypted with any of the user keys');
    }

    const encryptedWithKeyID = userEncryptedWithKeyIDs[0];
    const encryptedWithKeys = recipientPrivateKey.getKeys(encryptedWithKeyID);
    expect(encryptedWithKeys[0]).toBeDefined();

    if (!encryptedWithKeys[0]) {
      throw Error('could not find keyID ' + encryptedWithKeyID.toHex());
    }
    const encryptedWithKey = encryptedWithKeys[0];

    expect(encryptedWithKey.getFingerprint()).toBeDefined();
    //console.log('Encrypted with Key (UserIDs): ' + recipientPublicKey.getUserIDs().toString());
    // End of Section

    // TODO: senderPublicKey should be compared against contacts and WKD for verification;
    // otherwise, there should be an indication that the key isn't trusted
    const { decrypted, signatures, signatureVerified } = await decryptMessage(
      encryptedMessage,
      senderPublicKey, // optional
      recipientPrivateKey
    );

    expect(decrypted.toString()).toEqual(USER_MESSAGE);
    expect(signatures.length).toBeGreaterThan(0);
    expect(signatureVerified).toBeTruthy();

    // example from RFC to validate that our function is correct
    expect(await verifyWKDHash('Joe.Doe', 'iy9q119eutrkn8s1mk4r39qejnbu3n5q')).toBeTruthy();

    expect(await verifyWKDHash('Purple.Hippo.Rhino', 'iy9q119eutrkn8s1mk4r39qejnbu3n5q')).toBeFalsy();

    /* Add back in when we have a town WKD server
    const key = await fetchWKDKey('spammerspammerabc123@proton.me', new URL('http://localhost:9999'));
    if (!key) {
      console.log('COULD NOT FIND KEY FOR USER');
    } else {
      console.log(key.armor());
      key.getKeys().forEach((mykey) => console.log(mykey.getFingerprint()));
      key.getKeys().forEach((mykey) => console.log(mykey.getAlgorithmInfo()));
      const encKey = await key.getEncryptionKey();
      if (encKey) {
        console.log('encryption key fingerprint: ' + encKey.getFingerprint());
      }
      const sinKey = await key.getSigningKey();
      if (sinKey) {
        console.log('signing key fingerprint: ' + sinKey.getFingerprint());
      }
    }
    */
  });
});
