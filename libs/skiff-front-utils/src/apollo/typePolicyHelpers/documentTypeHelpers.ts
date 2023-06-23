/* eslint-disable import/prefer-default-export */
import memoize from 'lodash-es/memoize';
import { stringDecryptAsymmetric, decryptSymmetric } from '@skiff-org/skiff-crypto';
import { Document, DocumentDataDatagram, HierarchicalPermissionChainLink } from 'skiff-front-graphql';
import { assertExists } from 'skiff-utils';

import { PDFDocument, RichTextDocument } from '../../types';
import { decryptContents, decryptSessionKey } from '../../utils/documentUtils/docCryptoUtils';
import { getPublicDocumentDecryptedPrivateHierarchicalKeys } from '../publicDocumentAuth';

/**
 * Decrypt a document content with session key and password if needed, used for Document and PublicDocument
 */
export const decryptDocumentContent = (
  encryptedContents: Document['contents'],
  sessionKey: string,
  documentPassword: string
) => {
  const decryptedContents = decryptContents(encryptedContents, sessionKey);
  return {
    contentsArr: decryptedContents.contentsArr.map((decryptedContent) => {
      // For each content chunk, if it's encrypted, try to decrypt it with the stored derived password
      // If we can't (invalid password), return null to indicate the error
      const chunkData = decryptedContent.chunkData as RichTextDocument | PDFDocument;
      let decryptedDocumentData: string | null;
      if (chunkData.hasPassword) {
        try {
          decryptedDocumentData = decryptSymmetric(chunkData.documentData, documentPassword, DocumentDataDatagram);
        } catch (e) {
          decryptedDocumentData = null;
        }
      } else {
        decryptedDocumentData = chunkData.documentData;
      }
      return {
        ...decryptedContent,
        chunkData: {
          ...chunkData,
          documentData: decryptedDocumentData
        }
      };
    })
  };
};

// Return a date memoized from a string, useful when returning date in apollo cache to make sure it doesn't trigger a rerender because
// Date cannot be compared by identify even when constructed from the same source string
export const parseAsMemoizedDate = memoize((date: string) => date && new Date(date));

// eslint-disable-next-line arrow-body-style
export const decryptHierarchicalPermissionsChain = (
  privateKey: string | undefined,
  decryptedPublicDocPrivateHierarchicalKeys: ReturnType<typeof getPublicDocumentDecryptedPrivateHierarchicalKeys>,
  hierarchicalPermissionsChain: readonly HierarchicalPermissionChainLink[]
) => {
  const finalDocID = hierarchicalPermissionsChain[0].docID;
  // Go through the HierarchicalPermissionsChain and decrypt each chain link one at a time
  // There is two ways of decrypting a link: using the current user private key or by using the parent link privateHierarchicalKey
  // we use reduceRight to start from the top of the chain link = from the highest parent
  const decryptedLastLink = hierarchicalPermissionsChain.reduceRight<{
    decryptedSessionKey: string | null | undefined;
    decryptedPrivateHierarchicalKey: string | null | undefined;
  } | null>((previousChainLink, chainLink) => {
    if (chainLink.permission) {
      assertExists(privateKey);
      // the chain link has privateHierarchicalKey encrypted for current user, we decrypt them with the user private key
      // this happens when the document related to this link has been shared explicitely with the user
      // if the document was created before hierarchical keys were introduced, chainLink.permission.encryptedPrivateHierarchicalKey will be null and so we ignore it
      const decryptedPrivateHierarchicalKey =
        chainLink.permission.encryptedPrivateHierarchicalKey &&
        decryptSessionKey(
          chainLink.permission.encryptedPrivateHierarchicalKey,
          privateKey,
          chainLink.permission.encryptedBy
        );
      const decryptedSessionKey =
        chainLink.permission.encryptedKey &&
        decryptSessionKey(
          chainLink.permission.encryptedKey, // encrypted document session key
          privateKey,
          chainLink.permission.encryptedBy
        );
      return {
        decryptedSessionKey,
        decryptedPrivateHierarchicalKey
      };
    }
    if (decryptedPublicDocPrivateHierarchicalKeys[chainLink.docID]) {
      // We can decrypt this link because we have the decrypted private hierarchical key of this doc from the doc public link
      assertExists(
        chainLink.encryptedSessionKey,
        'Got the decryptedPrivateHierarchicalKey through public link but no encryptedSessionKey was provided'
      );
      assertExists(
        chainLink.encryptedSessionKeyEncryptedByKey,
        'Got the decryptedPrivateHierarchicalKey through public link but no encryptedSessionKeyEncryptedByKey was provided'
      );
      return {
        decryptedPrivateHierarchicalKey: decryptedPublicDocPrivateHierarchicalKeys[chainLink.docID],
        decryptedSessionKey: decryptSessionKey(
          chainLink.encryptedSessionKey,
          decryptedPublicDocPrivateHierarchicalKeys[chainLink.docID],
          {
            key: chainLink.encryptedSessionKeyEncryptedByKey
          }
        )
      };
    }

    // this link only has encrypted keys with the parent document hierarchicalKey, we use the previously decrypted link keys to decrypt this link
    // this happens when the document related to this link is a children of a document shared with the current user
    assertExists(chainLink.keysClaim, `No keysClaim when decrypting hierarchical permission chain of ${finalDocID}`); // chainLink.parentKeysClaim is required to be set
    assertExists(
      chainLink.keysClaimEncryptedByKey,
      `No keysClaimEncryptedByKey when decrypting hierarchical permission chain of ${finalDocID}`
    );
    assertExists(
      previousChainLink,
      `No previousChainLink when decrypting hierarchical permission chain of ${finalDocID}`
    ); // we need the parent link privateHierarchicalKey to decrypt this chain link
    assertExists(
      previousChainLink.decryptedPrivateHierarchicalKey,
      `No previousChainLink.decryptedPrivateHierarchicalKey when decrypting hierarchical permission chain of ${finalDocID}`
    ); // the previous chain link needs to have a decrypted privateHierarchicalKey to decrypt this link
    try {
      const decryptedParentKeyClaim: { sessionKey: string; privateHierarchicalKey: string } = JSON.parse(
        stringDecryptAsymmetric(
          previousChainLink.decryptedPrivateHierarchicalKey,
          { key: chainLink.keysClaimEncryptedByKey },
          chainLink.keysClaim
        )
      ) as { sessionKey: string; privateHierarchicalKey: string };
      return {
        decryptedSessionKey: decryptedParentKeyClaim.sessionKey,
        decryptedPrivateHierarchicalKey: decryptedParentKeyClaim.privateHierarchicalKey
      };
    } catch (e) {
      console.error(
        `Couldn't decrypt parent key claim of ${chainLink.docID} with previousChainLink.decryptedPrivateHierarchicalKey`
      );
      throw e;
    }
  }, null);
  assertExists(
    decryptedLastLink,
    `No decryptedLastLink when decrypting hierarchical permission chain of ${finalDocID}`
  );

  const { decryptedPrivateHierarchicalKey, decryptedSessionKey } = decryptedLastLink;

  if (hierarchicalPermissionsChain[0].encryptedSessionKey) {
    // document has its session key encrypted by its hierarchical key, use this in priority
    assertExists(
      decryptedPrivateHierarchicalKey,
      `No decryptedPrivateHierarchicalKey when decrypting hierarchical permission chain of ${finalDocID}`
    );
    assertExists(
      hierarchicalPermissionsChain[0].encryptedSessionKeyEncryptedByKey,
      `No hierarchicalPermissionsChain[0].encryptedSessionKeyEncryptedByKey when decrypting hierarchical permission chain of ${finalDocID}`
    );
    return {
      decryptedPrivateHierarchicalKey: decryptedLastLink.decryptedPrivateHierarchicalKey,
      decryptedSessionKey: decryptSessionKey(
        hierarchicalPermissionsChain[0].encryptedSessionKey,
        decryptedPrivateHierarchicalKey,
        { key: hierarchicalPermissionsChain[0].encryptedSessionKeyEncryptedByKey }
      )
    };
  }

  assertExists(
    decryptedSessionKey,
    `No decryptedSessionKey when decrypting hierarchical permission chain of ${finalDocID}`
  );
  return { decryptedPrivateHierarchicalKey, decryptedSessionKey };
};
