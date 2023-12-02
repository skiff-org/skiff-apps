import {
  Datagram,
  decryptSymmetric,
  encryptSymmetric,
  stringDecryptAsymmetric,
  stringEncryptAsymmetric
} from 'skiff-crypto';

interface EncryptedSearchData {
  encryptedKey: string; // key encrypted with user keypair, used to decrypt `encryptedSearchIndex`
  encryptedSearchIndex: string; // encrypted StoredEditorSearchIndex
}

// Decrypt a search index by first decrypting the symmetric key with the user public/private key pair
// and then use this decrypted key to symmetrically decrypt the search index data
export function decryptSearchIndex<T>(
  encryptedSearchData: EncryptedSearchData,
  publicKey: string,
  privateKey: string,
  datagram: Datagram<T>
) {
  const { encryptedSearchIndex, encryptedKey } = encryptedSearchData;

  const symmetricKey = stringDecryptAsymmetric(privateKey, { key: publicKey }, encryptedKey);

  const searchIndex = decryptSymmetric(encryptedSearchIndex, symmetricKey, datagram);
  return {
    symmetricKey,
    searchIndex
  };
}

// encrypt the search index data with the symmetric key and encrypt the symmetric key with the user
// public/private key pair
export function encryptSearchIndex<T>(
  searchData: T,
  publicKey: string,
  privateKey: string,
  symmetricKey: string,
  datagram: Datagram<T>
): EncryptedSearchData {
  const encryptedSearchIndex = encryptSymmetric(searchData, symmetricKey, datagram);
  const encryptedKey = stringEncryptAsymmetric(privateKey, { key: publicKey }, symmetricKey);

  return { encryptedKey, encryptedSearchIndex };
}
