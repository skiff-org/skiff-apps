import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import FileResizer from 'react-image-file-resizer';
import {
  createKeyFromSecret,
  createPasswordDerivedSecret,
  decryptSymmetric,
  encryptDatagramV2,
  encryptSymmetric,
  generateHash,
  generatePublicPrivateKeyPair
} from 'skiff-crypto';
import {
  GetDocumentFullDocument,
  GetDocumentFullQuery,
  GetDocumentFullQueryVariables,
  GetPendingDocumentKeyUpgradesDocument,
  GetPendingDocumentKeyUpgradesQuery,
  GetPendingDocumentKeyUpgradesQueryVariables,
  LinkLinkKeyDatagram,
  LinkPrivateHierarchicalKeyDatagram,
  LinkSessionKeyDatagram,
  SaveThumbnailDocument,
  SaveThumbnailMutation,
  SaveThumbnailMutationVariables,
  ThumbnailDatagram,
  UpgradeHierarchicalKeysDocument,
  UpgradeHierarchicalKeysMutation,
  UpgradeHierarchicalKeysMutationVariables,
  UpgradeHierarchicalKeysNewHierarchicalKeyItem,
  UpgradeHierarchicalKeysNewKeysClaimItem,
  UpgradeKeyDocument,
  UpgradeKeyMutation,
  UpgradeKeyMutationVariables,
  UpgradeKeyRequest,
  models
} from 'skiff-front-graphql';
import {
  Conflict,
  NeedNewHierarchicalKey,
  NeedNewSessionKey,
  NewKeyNotNeeded,
  isApolloLogicErrorType
} from 'skiff-graphql';
import { Awaited, WithRequired, assertExists, MAX_THUMBNAIL_DIMENSIONS, RESIZE_QUALITY } from 'skiff-utils';

import { decryptHierarchicalPermissionsChain, requireCurrentUserData } from '../../apollo';
import { FileTypes, getFileTypeFromMimeType } from '../fileUtils';
import { sha256 } from '../hashUtils';

import {
  encryptContents,
  encryptMetadata,
  encryptParentKeysClaim,
  encryptPrivateHierarchicalKeyForUser,
  encryptSessionKey,
  generateSessionKey
} from './docCryptoUtils';
import { downloadDocument } from './downloadDocument';

type DocumentWithHierarchicalKey = WithRequired<
  Awaited<ReturnType<typeof downloadDocument>>,
  'publicHierarchicalKey' | 'decryptedPrivateHierarchicalKey'
>;

// Wrap a function operating on document to handle typical errors and automatically retry the operation
// This will handle NeedNewHierarchicalKey, Conflict, NeedNewSessionKey and NewKeyNotNeeded errors
export const wrapDocumentOperation = async <T>(
  client: ApolloClient<NormalizedCacheObject>,
  docIDs: string[],
  handler: (docs: DocumentWithHierarchicalKey[]) => Promise<T>,
  forceNetwork = false,
  userData?: models.User
): Promise<T | null> => {
  // downloading document one-by-one instead of in a single request to use the Apollo cache in priority
  // (a multi-document request will trigger a network call even if all docIDs are in the cache because the query itself is not cached)
  const documents = await Promise.all(docIDs.map((docID) => downloadDocument(client, docID, forceNetwork, userData)));

  for (const document of documents) {
    if (!document.publicHierarchicalKey) {
      await upgradeHierarchicalKey(client, document.docID, userData);
      return wrapDocumentOperation(client, docIDs, handler, undefined, userData);
    }
  }

  try {
    const result = await handler(
      // need to cast it as the previous condition is not recognized by TS
      documents as DocumentWithHierarchicalKey[]
    );
    return result;
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    const firstError = (e as any)?.graphQLErrors?.[0];
    if (isApolloLogicErrorType(firstError, NeedNewHierarchicalKey)) {
      await upgradeHierarchicalKey(client, firstError.extensions.docID, userData);
      return wrapDocumentOperation(client, docIDs, handler, undefined, userData);
    }
    if (isApolloLogicErrorType(e, Conflict)) {
      return wrapDocumentOperation(client, docIDs, handler, true, userData);
    }
    if (isApolloLogicErrorType(firstError, NeedNewSessionKey)) {
      await upgradeDocKey(client, firstError.extensions.docID);
      return wrapDocumentOperation(client, docIDs, handler, true, userData);
    }

    if (isApolloLogicErrorType(e, NewKeyNotNeeded)) {
      // redownload all documents and return  without error
      await Promise.all(docIDs.map((docID) => downloadDocument(client, docID, true, userData)));
      return null;
    }

    throw (firstError as Error) || e;
  }
};

/**
 * Create a new document key and save a copy encrypted with each collaborator key.
 * @param {string} docID - document id
 * @returns {Promise<boolean>} Boolean indicator for unshare success or failure.
 */
export async function upgradeDocKey(
  client: ApolloClient<NormalizedCacheObject>,
  docID: string,
  user?: models.User
): Promise<null> {
  return wrapDocumentOperation(
    client,
    [],
    async () => {
      const userData = user ?? requireCurrentUserData();
      const res = await client.query<GetDocumentFullQuery, GetDocumentFullQueryVariables>({
        query: GetDocumentFullDocument,
        variables: {
          request: {
            docID
          }
        },
        fetchPolicy: 'network-only'
      });
      const document = res.data.document;
      assertExists(document);

      if (!document.decryptedPrivateHierarchicalKey) {
        // document was created before we introduced hierarchical keys claims, need to upgrade the hierarchicalKeys before upgrading doc
        await upgradeHierarchicalKey(client, docID, userData);
        return upgradeDocKey(client, docID, userData); // retry again with upgraded document
      }
      assertExists(document.publicHierarchicalKey);

      const newSessionKey = generateSessionKey();

      const upgradeKeyRequest: UpgradeKeyRequest = {
        docID,
        publicHierarchicalKey: document.publicHierarchicalKey,
        encryptedMetadata: encryptMetadata(
          document.decryptedMetadata,
          newSessionKey,
          userData.signingPublicKey,
          userData.privateUserData.signingPrivateKey
        ),
        encryptedContents: encryptContents(
          document.decryptedContents,
          newSessionKey,
          userData.signingPublicKey,
          userData.privateUserData.signingPrivateKey
        ),
        encryptedSessionKey: encryptSessionKey(
          newSessionKey,
          document.publicHierarchicalKey,
          userData.privateUserData.privateKey
        ),
        encryptedSessionKeyEncryptedByKey: userData.publicKey.key,
        previousEncryptedContentsHash: await sha256(document.contents.contentsArr[0]?.content)
      };

      if (document.link) {
        // if document has a public link, we need to reencrypt the new session key with the linkKey to keep the link valid
        upgradeKeyRequest.previousEncryptedLinkKey = document.link.encryptedLinkKey;

        const masterSecret = await createKeyFromSecret(document.link.decryptedLinkKey, document.link.salt);
        const hashedSalt = generateHash(docID);
        const linkKey = createPasswordDerivedSecret(masterSecret, hashedSalt);
        const encryptedSessionKey = encryptSymmetric(newSessionKey, linkKey, LinkSessionKeyDatagram);
        const encryptedPrivateHierarchicalKey = encryptSymmetric(
          document.decryptedPrivateHierarchicalKey,
          linkKey,
          LinkPrivateHierarchicalKeyDatagram
        );
        const encryptedLinkKey = encryptSymmetric(document.link.decryptedLinkKey, newSessionKey, LinkLinkKeyDatagram);

        upgradeKeyRequest.encryptedLinkKey = encryptedLinkKey;
        upgradeKeyRequest.sessionKeyEncryptedByLinkKey = encryptedSessionKey;
        upgradeKeyRequest.privateHierarchicalKeyEncryptedByLinkKey = encryptedPrivateHierarchicalKey;
      }

      await client.mutate<UpgradeKeyMutation, UpgradeKeyMutationVariables>({
        mutation: UpgradeKeyDocument,
        variables: {
          request: upgradeKeyRequest
        }
      });
      return null;
    },
    undefined,
    user
  );
}

// Upgrade the hierarchical key of the target document and every parent document that need a new hierarchical key. It also updates the keys claims that need re-encryption
// look at pendingDocumentKeyUpgrades query and upgradeHierarchicalKeys mutation document on the server for more details
export function upgradeHierarchicalKey(client: ApolloClient<NormalizedCacheObject>, docID: string, user?: models.User) {
  console.log('upgradeHierarchicalKey', docID);
  return wrapDocumentOperation(
    client,
    [],
    async () => {
      const userData = user ?? requireCurrentUserData();
      console.log('GetPendingDocumentKeyUpgradesQuery');
      const res = await client.query<GetPendingDocumentKeyUpgradesQuery, GetPendingDocumentKeyUpgradesQueryVariables>({
        query: GetPendingDocumentKeyUpgradesDocument,
        variables: { request: { rootDocumentId: docID } },
        fetchPolicy: 'network-only'
      });
      console.log('res', res.data.pendingDocumentKeyUpgrades);
      const { pendingDocumentKeyUpgrades } = res.data;

      // storing all newly generated key pairs to be used when update keys claim in second step
      const newHierarchicalKeysPairs = {} as { [docID: string]: ReturnType<typeof generatePublicPrivateKeyPair> };

      // 1 - Create new hierarchical key pairs for all documents that needs it
      const newHierarchicalKeys = pendingDocumentKeyUpgrades.newHierarchicalKeys.map(
        (newHierarchicalKeyRequest): UpgradeHierarchicalKeysNewHierarchicalKeyItem => {
          const decryptedKeys = decryptHierarchicalPermissionsChain(
            userData.privateUserData.privateKey,
            {}, // not using public doc private hierarchical keys
            newHierarchicalKeyRequest.hierarchicalPermissionChain
          );
          const newHierarchicalKeyPair = generatePublicPrivateKeyPair();
          newHierarchicalKeysPairs[newHierarchicalKeyRequest.docID] = newHierarchicalKeyPair;
          const permissions = newHierarchicalKeyRequest.collaboratorsIDs.map((collaboratorID) => {
            const collaboratorData = pendingDocumentKeyUpgrades.collaborators.find(
              ({ userID }) => userID === collaboratorID
            );
            assertExists(collaboratorData, 'collaborator info was not provided in PendingDocumentKeyUpgrades response'); // safe-guard, should never happen
            return {
              userID: collaboratorID,
              encryptedBy: userData.publicKey,
              encryptedPrivateHierarchicalKey: encryptPrivateHierarchicalKeyForUser(
                newHierarchicalKeyPair.privateKey,
                collaboratorData.publicKey,
                userData.privateUserData.privateKey
              )
            };
          });

          const decryptedLinkKey =
            newHierarchicalKeyRequest.encryptedLinkKey &&
            decryptSymmetric(
              newHierarchicalKeyRequest.encryptedLinkKey,
              decryptedKeys.decryptedSessionKey,
              LinkLinkKeyDatagram
            );

          return {
            docID: newHierarchicalKeyRequest.docID,
            permissions,
            publicHierarchicalKey: newHierarchicalKeyPair.publicKey,
            previousPublicHierarchicalKey: newHierarchicalKeyRequest.currentPublicHierarchicalKey,
            encryptedPrivateHierarchicalKeyByLinkKey: decryptedLinkKey
              ? encryptSymmetric(
                  newHierarchicalKeyPair.privateKey,
                  decryptedLinkKey,
                  LinkPrivateHierarchicalKeyDatagram
                )
              : undefined,
            previousEncryptedLinkKey: newHierarchicalKeyRequest.encryptedLinkKey,
            previousEncryptedSessionKey: newHierarchicalKeyRequest.hierarchicalPermissionChain[0].encryptedSessionKey,
            encryptedSessionKey: encryptSessionKey(
              decryptedKeys.decryptedSessionKey,
              newHierarchicalKeyPair.publicKey,
              userData.privateUserData.privateKey
            ),
            encryptedSessionKeyEncryptedByKey: userData.publicKey.key
          };
        }
      );

      // 2 - Update all keys claim that are impacted by the new hierarchical keys generated at step 1
      // a keysClaim need to be updated if either (or both):
      // - the source document hierarchical key changed => the keys claim need to be re-encrypted with the new hierarchical key of the source document
      // - the target document hierarchical key changed => the keys claim need to be update to include the new private hierarchical key of the target document
      const newKeysClaims = pendingDocumentKeyUpgrades.newKeysClaims.map(
        (newKeysClaimRequest): UpgradeHierarchicalKeysNewKeysClaimItem => {
          // if the source document hierarhical key was changed, use it, else use the public hierarchical key provided by the server
          const sourceDocPublicHierarchicalKey =
            newHierarchicalKeysPairs[newKeysClaimRequest.keysClaimSourceDocID]?.publicKey ??
            newKeysClaimRequest.keysClaimSourceDocPublicHierarchicalKey;
          assertExists(
            sourceDocPublicHierarchicalKey,
            `Source document public hierarchical key for keyClaim update (${newKeysClaimRequest.docID} / ${newKeysClaimRequest.keysClaimSourceDocID}) not provided`
          ); // sanity-check

          const targetPreviousKeys = decryptHierarchicalPermissionsChain(
            userData.privateUserData.privateKey,
            {}, // not using public doc private hierarchical keys
            newKeysClaimRequest.hierarchicalPermissionChain
          );
          // if the target hierarchical key was change, use it, else use the private hierarchical key provided by the server in hierarchicalPermissionChain
          const newTargetHierarchicalKey =
            newHierarchicalKeysPairs[newKeysClaimRequest.docID]?.privateKey ??
            targetPreviousKeys.decryptedPrivateHierarchicalKey;

          // the new keys claim now includes the targetDoc private hierarchicalKey encrypted by the sourceDoc public hierarchicalKey
          const newKeysClaim = encryptParentKeysClaim(
            {
              sessionKey: targetPreviousKeys.decryptedSessionKey,
              privateHierarchicalKey: newTargetHierarchicalKey
            },
            sourceDocPublicHierarchicalKey,
            userData.privateUserData.privateKey
          );

          return {
            docID: newKeysClaimRequest.docID,
            keysClaimSourceDocID: newKeysClaimRequest.keysClaimSourceDocID,
            keysClaim: newKeysClaim,
            keysClaimEncryptedByKey: userData.publicKey.key,
            keysClaimSourceDocPublicHierarchicalKey: sourceDocPublicHierarchicalKey,
            previousKeysClaim: newKeysClaimRequest.currentKeysClaim
          };
        }
      );

      const upgradeRes = await client.mutate<UpgradeHierarchicalKeysMutation, UpgradeHierarchicalKeysMutationVariables>(
        {
          mutation: UpgradeHierarchicalKeysDocument,
          variables: {
            request: {
              newHierarchicalKeys,
              newKeysClaims
            }
          }
        }
      );
      return upgradeRes.data?.upgradeHierarchicalKeys.documents?.[0];
    },
    undefined,
    user
  );
}

/**
 * update a document's thumbnail
 * @param client - ApolloClient
 * @param docID - document's ID
 * @param thumbnail - new thumbnail data string / null to remove
 */
export const changeDocThumbnail = async (
  client: ApolloClient<NormalizedCacheObject>,
  docID: string,
  thumbnail?: string | null
) =>
  wrapDocumentOperation(client, [docID], async ([document]) => {
    // ignore of team document
    if (document?.team?.rootDocument?.docID === document.docID || !thumbnail) {
      return;
    }

    const { decryptedSessionKey } = document;

    const encryptedThumbnail = encryptDatagramV2(
      ThumbnailDatagram,
      {},
      { decryptedThumbnail: thumbnail },
      decryptedSessionKey
    );

    await client.mutate<SaveThumbnailMutation, SaveThumbnailMutationVariables>({
      mutation: SaveThumbnailDocument,
      variables: {
        request: {
          thumbnail: encryptedThumbnail.encryptedData,
          docID
        }
      }
    });
  });

/**
 * Resize and image to thumbnail specific size
 * @param source - source data
 * @param mimeType - data mime type (needed for resize)
 * @returns the resized image
 */
async function resizeImage(source: string, mimeType: string) {
  const res = await fetch(source);
  const imageBuffer = await res.arrayBuffer();
  const imageBlob = new Blob([imageBuffer], { type: mimeType });
  return new Promise((resolve) => {
    FileResizer.imageFileResizer(
      imageBlob,
      MAX_THUMBNAIL_DIMENSIONS,
      MAX_THUMBNAIL_DIMENSIONS,
      'JPEG',
      RESIZE_QUALITY,
      0,
      (uri) => {
        resolve(uri);
      }
    );
  });
}

/**
 * Create a raw (before resize) thumbnail for a document based on file type
 * @param source - source data
 * @param mimeType - document's mime type
 * @returns the created raw thumbnail image
 */
function createRawThumbnailImage(source: string, mimeType: string) {
  const fileType = getFileTypeFromMimeType(mimeType);
  switch (fileType) {
    // for image no extra steps are required, as it's already an image
    case FileTypes.Image:
      return source;
    // each of these other types require different operation on the source data
    case FileTypes.Video:
    case FileTypes.Sound:
    case FileTypes.Pdf:
    default:
      throw new Error('File Type not supported : ' + fileType);
  }
}

/**
 * Create a thumbnail for a file and updates the document's thumbnail
 * @param source - the source data for the file
 * @param client - Apollo client
 * @param docId - document's id
 * @param mimeType - document's mime type
 */
export async function createAndUpdateThumbnail(
  source: string,
  client: ApolloClient<NormalizedCacheObject>,
  docId: string,
  mimeType?: string
) {
  try {
    if (!mimeType) return;
    const thumbnailImage = createRawThumbnailImage(source, mimeType);
    const thumbnailBase64 = (await resizeImage(thumbnailImage, mimeType)) as string;
    await changeDocThumbnail(client, docId, thumbnailBase64);
  } catch (err) {
    console.warn('could not update thumbnail', err);
  }
}
