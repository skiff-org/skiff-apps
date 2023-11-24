import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { decryptSymmetric } from 'skiff-crypto';
import {
  models,
  LinkLinkKeyDatagram,
  GetDocumentFullDocument,
  GetDocumentFullQuery,
  GetDocumentFullQueryVariables
} from 'skiff-front-graphql';
import { insertIf } from 'skiff-utils';

import { decryptHierarchicalPermissionsChain } from '../../apollo/typePolicyHelpers';

/**
 * Downloads, decrypts, and stores a document with optional slicing parameters.
 * @param {string} docID - The docID of the document to be downloaded.
 * @param {boolean} [forceDownload] - Force network call to server to get last version of the document
 * @returns {Promise<Document>} The document
 */
export async function downloadDocument(
  client: ApolloClient<NormalizedCacheObject>,
  docID: string,
  forceNetwork = false,
  userObj?: models.User
): Promise<GetDocumentFullQuery['document']> {
  const response = await client.query<GetDocumentFullQuery, GetDocumentFullQueryVariables>({
    query: GetDocumentFullDocument,
    variables: {
      request: {
        docID
      }
    },
    fetchPolicy: forceNetwork ? 'network-only' : 'cache-first'
  });
  // do decryption - type policy does not run in React Native
  if (response.data?.document && userObj) {
    const doc = response.data.document;
    if (doc && !doc.decryptedPrivateHierarchicalKey) {
      const decryptedInfo = decryptHierarchicalPermissionsChain(
        userObj?.privateUserData?.privateKey,
        {},
        doc.hierarchicalPermissionChain
      );
      let decryptedLinkKey = '';
      if (doc.link) {
        decryptedLinkKey = decryptSymmetric(
          doc.link?.encryptedLinkKey,
          decryptedInfo.decryptedSessionKey,
          LinkLinkKeyDatagram
        );
      }
      if (decryptedInfo.decryptedPrivateHierarchicalKey) {
        return {
          ...doc,
          decryptedPrivateHierarchicalKey: decryptedInfo.decryptedPrivateHierarchicalKey,
          decryptedSessionKey: decryptedInfo.decryptedSessionKey,
          ...insertIf(!!doc.link, {
            ...doc.link,
            decryptedLinkKey: decryptedLinkKey ?? ''
          })
        };
      }
    }
  }
  return response?.data?.document;
}
