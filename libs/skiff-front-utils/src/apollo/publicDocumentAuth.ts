import { makeVar } from '@apollo/client';
import isEqual from 'lodash-es/isEqual';
import { models } from 'skiff-front-graphql';
import { filterExists, memoizeOnDeps } from 'skiff-utils';

type RootPublicDocumentAuthData = {
  jwt: string; // access JWT for this document
  linkSecret: string; // link secret used (hash in public URL)
  decryptedPrivateHierarchicalKey: string;
  // This is a "fake" user created when accessing a new document
  // this contains keys that are generated client-side when opening a public link, these keys can be used for some crypto operations
  // that requires the user to sign an encrypted payload (like when creating a document, a private/public key pair is necessary to encrypt parentKeysClaim)
  ephemeralUser: models.User;
};

type ChildPublicDocumentAuthData = {
  rootPublicDocID: string; // DocID of the root public document when accessing a child of a public doc
};

type PublicDocumentAuthData = RootPublicDocumentAuthData | ChildPublicDocumentAuthData;

const publicDocumentsData = makeVar<{ [docID: string]: PublicDocumentAuthData }>({});

// This is used when accessing an editable public document. The JWT is returned by the server and used on any request like a classic JWT (in Authorization header)
// every children documents of the root public document should also be registered here
export const setPublicDocumentData = (docID: string, data: PublicDocumentAuthData) => {
  const existingPublicDocumentData = publicDocumentsData();
  if (isEqual(existingPublicDocumentData[docID], data)) {
    // do nothing is same data
    return;
  }

  publicDocumentsData({
    ...existingPublicDocumentData,
    [docID]: data
  });
};
export const getPublicDocumentAuthData = (docID: string) => {
  const authData = publicDocumentsData()[docID];
  if (!authData) {
    return null;
  }
  if ('rootPublicDocID' in authData) {
    return {
      rootPublicDocID: authData.rootPublicDocID,
      authData: publicDocumentsData()[authData.rootPublicDocID] as RootPublicDocumentAuthData
    };
  }
  return {
    rootPublicDocID: docID,
    authData
  };
};

// Get all public document JWT we have stored, there could be multiple JWT if navigating between multiple public documents
// this is used when testing which JWT should be used to make a gql request with a docID we never used before
export const getRootPublicDocumentsJwt = () =>
  Object.entries(publicDocumentsData())
    .map(([docID, authData]) =>
      'jwt' in authData // if jwt is not in authData, this is an entry for a child of a public document, ignoring it
        ? { rootPublicDocID: docID, jwt: authData.jwt }
        : null
    )
    .filter(filterExists);

// this is done to memoize the result of getPublicDocumentDecryptedPrivateHierarchicalKeys and not return a new object
// each time which breaks the apollo memoization
export const getPublicDocumentDecryptedPrivateHierarchicalKeys = memoizeOnDeps(
  () => publicDocumentsData(),
  () =>
    Object.fromEntries(
      Object.entries(publicDocumentsData())
        .map(([docID, authData]) =>
          'decryptedPrivateHierarchicalKey' in authData ? [docID, authData.decryptedPrivateHierarchicalKey] : null
        )
        .filter(filterExists)
    ) as { [docID: string]: string }
);

export const resetPublicDocumentAuth = () => {
  publicDocumentsData({});
};
