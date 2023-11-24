import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import srp from 'secure-remote-password/client';
import { generateSymmetricKey } from 'skiff-crypto';
import {
  createKeyFromSecret,
  createSRPKey,
  createPasswordDerivedSecret,
  generateHash,
  encryptSymmetric,
  createDetachedSignatureAsymmetric
} from 'skiff-crypto';
import {
  models,
  LinkLinkKeyDatagram,
  LinkPrivateHierarchicalKeyDatagram,
  LinkSessionKeyDatagram,
  SetupLinkDocument,
  SetupLinkMutation,
  SetupLinkMutationVariables
} from 'skiff-front-graphql';
import { PermissionLevel, SignatureContext } from 'skiff-graphql';

import { requireCurrentUserData } from '../../apollo';

import { upgradeDocKey, wrapDocumentOperation } from './documentOperationUtils';

/**
 * Sets up a link to access a document. Generates variables required for SRP
 * with a randomly generated "password" that is used as a symetric key.
 * @param {string} docID - Document ID
 * @param {PermissionLevel} permissionLevel - Permission level for linked document.
 */
export async function setupLink(
  client: ApolloClient<NormalizedCacheObject>,
  docID: string,
  permissionLevel: PermissionLevel,
  userObj?: models.User
): Promise<null> {
  return wrapDocumentOperation(
    client,
    [docID],
    async ([document]) => {
      const userData = userObj ?? requireCurrentUserData();

      if (!document.hierarchicalPermissionChain[0].encryptedSessionKey || !document.decryptedSessionKey) {
        // document was created before we introduced encryptedSessionKey in Document, in this case, upgrade the document key first to populate this field
        await upgradeDocKey(client, docID, userObj);
        return setupLink(client, docID, permissionLevel, userObj); // retry again with upgraded document
      }

      const sessionKey = document.decryptedSessionKey;
      // note - linkSecret can be anything, even user input
      const linkSecret = generateSymmetricKey();
      // now, run SRP with symmetricKey as password and docID as username
      const salt = srp.generateSalt();
      const masterSecret = await createKeyFromSecret(linkSecret, salt);
      const verifierPrivateKey = createSRPKey(masterSecret, salt);
      const verifier = srp.deriveVerifier(verifierPrivateKey);
      const hashedSalt = generateHash(docID);
      // we use createPasswordDerivedSecret to give flexibility to the symmetric key above
      // utlimately, we could use a user-generated password or a short random PIN
      const linkKey = createPasswordDerivedSecret(masterSecret, hashedSalt);
      // encrypt session key with link key (for people to join via link)
      // and encrypt link key with session key (so link is accessible in future)
      const encryptedSessionKey = encryptSymmetric(sessionKey, linkKey, LinkSessionKeyDatagram);
      const encryptedPrivateHierarchicalKey = encryptSymmetric(
        document.decryptedPrivateHierarchicalKey,
        linkKey,
        LinkPrivateHierarchicalKeyDatagram
      );
      const encryptedLinkKey = encryptSymmetric(linkSecret, sessionKey, LinkLinkKeyDatagram);
      // generate hash from _random_ symmetric key
      const linkKeySignature = createDetachedSignatureAsymmetric(
        encryptedLinkKey,
        userData.privateUserData.signingPrivateKey,
        SignatureContext.LinksLinkKey
      );
      const sessionKeySignature = createDetachedSignatureAsymmetric(
        encryptedSessionKey,
        userData.privateUserData.signingPrivateKey,
        SignatureContext.LinksSessionKey
      );

      await client.mutate<SetupLinkMutation, SetupLinkMutationVariables>({
        mutation: SetupLinkDocument,
        variables: {
          request: {
            docID,
            salt,
            verifier,
            encryptedSessionKey,
            encryptedLinkKey,
            sessionKeySignature,
            linkKeySignature,
            permissionLevel,
            encryptedPrivateHierarchicalKey,
            currentPublicHierarchicalKey: document.publicHierarchicalKey,
            currentEncryptedSessionKey: document.hierarchicalPermissionChain[0].encryptedSessionKey
          }
        }
      });
      return null;
    },
    undefined,
    userObj
  );
}
