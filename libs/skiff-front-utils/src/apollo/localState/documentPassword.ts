import { makeVar } from '@apollo/client';
import { createKeyFromSecret } from 'skiff-crypto';

/**
 * This stores the key derived from the password for each document.
 * This is then used to decrypt the document (if protected by a password) or encrypt a new version of the content when saving it to the server
 * We store the key derived from the password instead of only the password because the operation to derive the key is async and so we cannot do it lazily
 * when decrypting the document.
 */
const documentDerivedPasswords = makeVar<{ [docID: string]: string }>({});

export const registerDocumentPassword = async (docID: string, docPassword: string) => {
  const derivedPassword = await createKeyFromSecret(docPassword, docID);
  const existingDerivedPassword = documentDerivedPasswords();
  documentDerivedPasswords({
    ...existingDerivedPassword,
    [docID]: derivedPassword
  });
};

export const getDocumentDerivedPassword = (docID: string) => documentDerivedPasswords()[docID];
