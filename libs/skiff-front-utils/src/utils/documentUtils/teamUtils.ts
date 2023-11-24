import { ApolloClient, FetchResult, NormalizedCacheObject } from '@apollo/client';
import {
  CreateTeamDocument,
  CreateTeamMutation,
  CreateTeamMutationVariables,
  CreateTeamRequest,
  GetDocumentFullDocument,
  GetOrganizationDocument,
  GetOrganizationQuery,
  ProductApp,
  ShareTeamDocWithOtherTeamDocument,
  ShareTeamDocWithOtherTeamMutation,
  ShareTeamDocWithOtherTeamMutationVariables,
  models
} from 'skiff-front-graphql';
import { HierarchicalPermissionChainLink, NwContentType } from 'skiff-graphql';
import { assertExists } from 'skiff-utils';

import { decryptHierarchicalPermissionsChain, getPublicDocumentDecryptedPrivateHierarchicalKeys } from '../../apollo';
import { addDocumentInDocumentsList } from '../cacheUtils';

import { createDocumentRequest } from './createDocRequest';
import { encryptParentKeysClaim } from './docCryptoUtils';
import { upgradeDocKey } from './documentOperationUtils';
import { downloadDocument } from './downloadDocument';

export const decryptHierarchicalKey = (
  privateKey: string,
  hierarchicalPermissionChain: HierarchicalPermissionChainLink[]
) => {
  const publicDocumentDecryptedPrivateHierarchicalKeys = getPublicDocumentDecryptedPrivateHierarchicalKeys();
  return (
    decryptHierarchicalPermissionsChain(
      privateKey,
      publicDocumentDecryptedPrivateHierarchicalKeys,
      hierarchicalPermissionChain
    ).decryptedPrivateHierarchicalKey ?? undefined
  );
};

/**
 * Share a team with another team. Target doc will be "shared" with everyone having access to Source doc.
 */
export async function shareTeamDocWithOtherTeam(
  client: ApolloClient<NormalizedCacheObject>,
  userData: models.User,
  sourceTeamRootDocID: string,
  targetTeamRootDocID: string
) {
  const sourceTeamRootDoc = await downloadDocument(client, sourceTeamRootDocID);
  const targetTeamRootDoc = await downloadDocument(client, targetTeamRootDocID);

  assertExists(sourceTeamRootDoc);
  assertExists(targetTeamRootDoc);

  let decryptedPrivateHierarchicalKey: string | undefined;
  const { decryptedPrivateHierarchicalKey: targetTeamDecryptedPrivateHierarchicalKey, decryptedSessionKey } =
    targetTeamRootDoc;
  if (!targetTeamDecryptedPrivateHierarchicalKey) {
    decryptedPrivateHierarchicalKey = decryptHierarchicalKey(
      userData.privateUserData.privateKey,
      targetTeamRootDoc.hierarchicalPermissionChain
    );
  } else {
    decryptedPrivateHierarchicalKey = targetTeamDecryptedPrivateHierarchicalKey;
  }
  assertExists(decryptedPrivateHierarchicalKey);
  assertExists(sourceTeamRootDoc.publicHierarchicalKey);

  const sourceKeysClaim = encryptParentKeysClaim(
    {
      sessionKey: decryptedSessionKey,
      privateHierarchicalKey: decryptedPrivateHierarchicalKey
    },
    sourceTeamRootDoc.publicHierarchicalKey,
    userData.privateUserData.privateKey
  );

  const reverseDocumentPermissionProxy = {
    targetDocID: targetTeamRootDoc.docID,
    sourceDocID: sourceTeamRootDoc.docID,
    targetDocPublicHierarchicalKey: targetTeamRootDoc.publicHierarchicalKey,
    sourceDocPublicHierarchicalKey: sourceTeamRootDoc.publicHierarchicalKey,
    sourceKeysClaim,
    sourceKeysClaimEncryptedByKey: userData.publicKey.key
  } as ShareTeamDocWithOtherTeamMutationVariables['request']['documentPermissionProxy'];

  await client.mutate<ShareTeamDocWithOtherTeamMutation, ShareTeamDocWithOtherTeamMutationVariables>({
    mutation: ShareTeamDocWithOtherTeamDocument,
    variables: {
      request: {
        documentPermissionProxy: reverseDocumentPermissionProxy
      }
    },
    refetchQueries: [{ query: GetDocumentFullDocument, variables: { request: { docID: targetTeamRootDocID } } }],
    awaitRefetchQueries: true
  });
}

/**
 * Create a new team inside the current organization.
 */
export async function createTeam(
  client: ApolloClient<NormalizedCacheObject>,
  userData: models.User,
  activeProductApp: ProductApp,
  name: string,
  icon: string,
  organization: Omit<GetOrganizationQuery['organization'], 'teams'>,
  inviteOnly?: boolean,
  rootDecryptedPrivateHierarchicalKey?: string
): Promise<FetchResult<CreateTeamMutation, Record<string, any>, Record<string, any>>> {
  const { everyoneTeam, orgID, rootDocID: orgRootDocID } = organization;
  assertExists(everyoneTeam.rootDocument);

  const everyoneTeamRootDoc = everyoneTeam.rootDocument;
  const everyoneTeamRootDocDecryptedPrivateHierarchicalKey =
    rootDecryptedPrivateHierarchicalKey ?? everyoneTeamRootDoc.decryptedPrivateHierarchicalKey;
  const { mutationPayload } = await createDocumentRequest(
    client,
    userData,
    { title: name },
    NwContentType.Folder,
    activeProductApp
  );

  // for Personal Migration migrated accounts, we need to rotate keys on their everyone team
  if (!everyoneTeamRootDocDecryptedPrivateHierarchicalKey) {
    await upgradeDocKey(client, everyoneTeamRootDoc.docID, userData);
    return createTeam(client, userData, activeProductApp, name, icon, organization, inviteOnly);
  }

  assertExists(everyoneTeamRootDocDecryptedPrivateHierarchicalKey);

  const everyoneDocumentPermissionProxy = {
    targetDocID: everyoneTeamRootDoc.docID,
    sourceDocID: '', // docID generated in create team mutation
    targetDocPublicHierarchicalKey: everyoneTeamRootDoc.publicHierarchicalKey,
    sourceDocPublicHierarchicalKey: mutationPayload.publicHierarchicalKey,
    sourceKeysClaimEncryptedByKey: userData.publicKey.key,
    sourceKeysClaim: encryptParentKeysClaim(
      {
        sessionKey: everyoneTeamRootDoc.decryptedSessionKey,
        privateHierarchicalKey: everyoneTeamRootDocDecryptedPrivateHierarchicalKey
      },
      mutationPayload.publicHierarchicalKey,
      userData.privateUserData.privateKey
    )
  } as CreateTeamMutationVariables['request']['everyoneDocumentPermissionProxy'];

  const newTeamRequest: CreateTeamRequest = {
    orgID,
    name,
    icon,
    rootDocument: {
      ...mutationPayload,
      // not setting parentKeysClaim here, org root document doesn't have access to its children
      parentDocID: orgRootDocID
    },
    everyoneDocumentPermissionProxy
  };
  const team = await client.mutate<CreateTeamMutation, CreateTeamMutationVariables>({
    mutation: CreateTeamDocument,
    variables: {
      request: newTeamRequest
    },
    refetchQueries: [{ query: GetOrganizationDocument, variables: { id: orgID } }],
    awaitRefetchQueries: true
  });

  assertExists(team.data?.createTeam.rootDocument);
  const teamRootDocumentID = team.data?.createTeam.rootDocument?.docID;
  if (!inviteOnly) {
    assertExists(team.data.createTeam.rootDocument);
    // Share with everyone
    await shareTeamDocWithOtherTeam(
      client,
      userData,
      everyoneTeamRootDoc.docID,
      team.data.createTeam.rootDocument.docID
    );
  }

  const teamDocument = await downloadDocument(client, teamRootDocumentID, true);
  assertExists(teamDocument);
  addDocumentInDocumentsList(client, teamDocument, activeProductApp);
  return team;
}
