import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import srp from 'secure-remote-password/client';
import { createKeyFromSecret, createSRPKey } from 'skiff-crypto';
import {
  generateInitialUserObject,
  encryptPrivateUserData,
  ProvisionSrpDocument,
  ProvisionSrpMutation,
  ProvisionSrpMutationVariables,
  GetOrganizationMembersDocument,
  PermissionEntryInput,
  ShareDocRequest,
  GetOrganizationQuery
} from 'skiff-front-graphql';
import { CreateSrpRequest, PermissionLevel, ProvisionEmailDetails } from 'skiff-graphql';
import { assertExists } from 'skiff-utils';
import { v4 } from 'uuid';
import isEmail from 'validator/lib/isEmail';

import { requireCurrentUserData } from '../../apollo';

import { encryptPrivateHierarchicalKeyForUser, signEncryptedPrivateHierarchicalKey } from './docCryptoUtils';

export async function provisionNewUser(
  client: ApolloClient<NormalizedCacheObject>,
  captchaToken: string,
  newUserAlias: string,
  newPassword: string,
  orgIDForRefetch: string,
  everyoneTeamRootDoc: GetOrganizationQuery['organization']['everyoneTeam']['rootDocument'],
  deliveryEmail?: string // optional field; if true, send email on provision
) {
  const newUserID = v4();
  const curUserData = requireCurrentUserData();

  assertExists(everyoneTeamRootDoc?.publicHierarchicalKey);
  assertExists(everyoneTeamRootDoc?.decryptedPrivateHierarchicalKey);
  assertExists(isEmail(newUserAlias), 'Must be a valid email address');

  const salt = srp.generateSalt();
  const masterSecret = await createKeyFromSecret(newPassword, salt);
  const privateKey = createSRPKey(masterSecret, salt);
  const verifier = srp.deriveVerifier(privateKey);
  const username = newUserAlias;
  const newUserData = generateInitialUserObject(username, masterSecret, salt);
  const { publicKey, signingPublicKey } = newUserData;
  const encryptedPrivateUserData = encryptPrivateUserData(
    newUserData.privateUserData,
    newUserData.passwordDerivedSecret
  );
  // No relevant attribution data because it's being provisioned internally
  const userAttributionData = {};

  const createSrpRequest: CreateSrpRequest = {
    captchaToken,
    salt,
    verifier,
    encryptedUserData: encryptedPrivateUserData,
    publicKey,
    signingPublicKey,
    userAttributionData
  };

  // Create permission entries
  const encryptedPrivateHierarchicalKey = encryptPrivateHierarchicalKeyForUser(
    everyoneTeamRootDoc.decryptedPrivateHierarchicalKey,
    publicKey, // new user public key
    curUserData.privateUserData.privateKey // current user
  );

  const fullEntry: PermissionEntryInput = {
    userID: newUserID,
    permissionLevel: PermissionLevel.Editor,
    encryptedPrivateHierarchicalKey: encryptedPrivateHierarchicalKey,
    encryptedBy: curUserData.publicKey
  };
  // Sign permission entries
  const signature = signEncryptedPrivateHierarchicalKey(
    fullEntry.encryptedPrivateHierarchicalKey, // for new user
    curUserData.privateUserData.signingPrivateKey, // sign by current user
    fullEntry
  );

  const shareDocRequest: ShareDocRequest = {
    docID: everyoneTeamRootDoc.docID,
    signatures: [signature],
    newPermissionEntries: [fullEntry],
    currentPublicHierarchicalKey: everyoneTeamRootDoc.publicHierarchicalKey
  };
  let provisionEmailDetails: ProvisionEmailDetails | undefined = undefined;
  if (deliveryEmail) {
    provisionEmailDetails = {
      temporaryPassword: newPassword,
      deliveryEmail
    };
  }

  const provisionResult = await client.mutate<ProvisionSrpMutation, ProvisionSrpMutationVariables>({
    mutation: ProvisionSrpDocument,
    variables: {
      request: {
        newUserID,
        shareDocRequest,
        createSrpRequest,
        emailAlias: newUserAlias,
        provisionEmailDetails
      }
    },
    refetchQueries: [{ query: GetOrganizationMembersDocument, variables: { id: orgIDForRefetch } }]
  });
  return provisionResult;
}
