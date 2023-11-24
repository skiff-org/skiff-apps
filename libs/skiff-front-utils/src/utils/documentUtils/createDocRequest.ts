import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { createDetachedSignatureAsymmetric, generatePublicPrivateKeyPair } from 'skiff-crypto';
import { DocumentDecryptedMetadata, NewDocRequest, models } from 'skiff-front-graphql';
import { NwContentType, PermissionLevel, ProductApp, SignatureContext } from 'skiff-graphql';
import { assertExists } from 'skiff-utils';
import { v4 } from 'uuid';

import { getPublicDocumentAuthData, requireCurrentUserData } from '../../apollo';
import { getDocumentBaseFromCache } from '../cacheUtils';

import {
  createDecryptedContents,
  encryptContents,
  encryptMetadata,
  encryptParentKeysClaim,
  encryptPrivateHierarchicalKeyForUser,
  encryptSessionKey,
  generateSessionKey,
  signEncryptedPrivateHierarchicalKey
} from './docCryptoUtils';
import { upgradeHierarchicalKey } from './documentOperationUtils';
import { downloadDocumentWithoutContent } from './downloadDocumentWithoutContent';

export const ROOT_FOLDER = 'Home';

export async function createDocumentRequest(
  client: ApolloClient<NormalizedCacheObject>,
  user: models.User,
  decryptedMetadata: Omit<DocumentDecryptedMetadata, '__typename'>,
  documentType: NwContentType,
  activeApp: ProductApp,
  parentDocID?: string,
  initialContents?: string,
  forcePermissionForCurrentUser = false, // will force having a permissions array with current user even if document has a parent
  parentPublicHierarchicalKey?: string,
  docID?: string,
  templateID?: string,
  docIcon?: string
) {
  const userData = // we use the fake user created when accessing the document through the public link in priority (even if user is logged in)
    user ??
    (parentDocID ? getPublicDocumentAuthData(parentDocID)?.authData.ephemeralUser : null) ??
    requireCurrentUserData();

  const { signingPrivateKey } = userData.privateUserData;
  const decryptedSessionKey = generateSessionKey();
  const hierarchicalKeyPair = generatePublicPrivateKeyPair();

  let parentKeysClaim: string | undefined;
  let newParentSig: string | undefined;
  let publicHierarchicalKeyOfParent: string | undefined;
  if (parentDocID && parentDocID !== ROOT_FOLDER) {
    let curParentPublicHierarchicalKey = parentPublicHierarchicalKey;
    if (!curParentPublicHierarchicalKey) {
      // note - may fail if permissions are invalid
      // hence parentPublicHierarchicalKey will be passed in in org context
      let parentDoc = getDocumentBaseFromCache(parentDocID, client);
      if (!parentDoc) {
        parentDoc = await downloadDocumentWithoutContent(client, parentDocID);
      }
      assertExists(parentDoc);
      if (!parentDoc.publicHierarchicalKey) {
        // parentDoc was created before we introduced hierarchical keys
        await upgradeHierarchicalKey(client, parentDocID, user);
        parentDoc = await downloadDocumentWithoutContent(client, parentDocID);
        assertExists(parentDoc);
      }
      assertExists(parentDoc.publicHierarchicalKey);
      curParentPublicHierarchicalKey = parentDoc.publicHierarchicalKey;
    }
    parentKeysClaim = encryptParentKeysClaim(
      {
        sessionKey: decryptedSessionKey,
        privateHierarchicalKey: hierarchicalKeyPair.privateKey
      },
      curParentPublicHierarchicalKey,
      userData.privateUserData.privateKey
    );
    newParentSig = createDetachedSignatureAsymmetric(parentDocID, signingPrivateKey, SignatureContext.DocumentParent);
    publicHierarchicalKeyOfParent = curParentPublicHierarchicalKey;
  }

  // if document has a parent, do not set any other permissions as we will use the same ones as the parent
  const permissions =
    parentDocID && !forcePermissionForCurrentUser
      ? []
      : [
          {
            userID: userData.userID,
            permissionLevel: PermissionLevel.Admin,
            expiryDate: undefined,
            encryptedPrivateHierarchicalKey: encryptPrivateHierarchicalKeyForUser(
              hierarchicalKeyPair.privateKey,
              userData.publicKey,
              userData.privateUserData.privateKey
            ),
            encryptedBy: userData.publicKey
          }
        ];
  // Array of signatures, one for each PermissionEntry in the permissions array above.
  const signatures = permissions.map((permission) =>
    signEncryptedPrivateHierarchicalKey(
      permission.encryptedPrivateHierarchicalKey,
      userData.privateUserData.signingPrivateKey,
      permission
    )
  );

  const decryptedContents = createDecryptedContents(documentType, initialContents);

  const icon = decryptedMetadata.icon ?? docIcon;
  const docMetadata: DocumentDecryptedMetadata = { ...decryptedMetadata, icon };
  const encryptedMetadata = encryptMetadata(
    docMetadata,
    decryptedSessionKey,
    userData.signingPublicKey,
    signingPrivateKey
  );
  const encryptedContents = encryptContents(
    decryptedContents,
    decryptedSessionKey,
    userData.signingPublicKey,
    signingPrivateKey
  );

  const mutationPayload: NewDocRequest = {
    documentType,
    encryptedMetadata,
    encryptedContents,
    permissions,
    signatures,
    parentDocID,
    parentSignature: newParentSig,
    publicHierarchicalKey: hierarchicalKeyPair.publicKey,
    parentKeysClaim,
    parentKeysClaimEncryptedByKey: parentKeysClaim ? userData.publicKey.key : undefined,
    publicHierarchicalKeyOfParent,
    encryptedSessionKey: encryptSessionKey(
      decryptedSessionKey,
      hierarchicalKeyPair.publicKey,
      userData.privateUserData.privateKey
    ),
    encryptedSessionKeyEncryptedByKey: userData.publicKey.key,
    docID: docID ?? v4(),
    templateID,
    activeProductApp: activeApp
  };

  return {
    mutationPayload,
    decryptedSessionKey,
    decryptedPrivateHierarchicalKey: hierarchicalKeyPair.privateKey
  };
}
