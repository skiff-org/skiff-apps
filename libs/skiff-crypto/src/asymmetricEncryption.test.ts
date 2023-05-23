import { stringDecryptAsymmetric, stringEncryptAsymmetric } from './asymmetricEncryption';
import { generatePublicPrivateKeyPair } from './keys';

describe('Asymmetric encryption', () => {
  it('should encrypt and decrypt a sample', () => {
    const sourceText = 'test secret';

    const keypair = generatePublicPrivateKeyPair();

    const encrypted = stringEncryptAsymmetric(keypair.privateKey, { key: keypair.publicKey }, sourceText);
    const decrypted = stringDecryptAsymmetric(keypair.privateKey, { key: keypair.publicKey }, encrypted);

    expect(decrypted).toBe(sourceText);
  });
});
