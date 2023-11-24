import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  models,
  GetDocumentFullDocument,
  PermissionEntryInput,
  ShareDocDocument,
  ShareDocMutation,
  ShareDocMutationVariables,
  AddPendingInviteMutation,
  AddPendingInviteDocument,
  AddPendingInviteMutationVariables,
  GetUserIdQuery,
  GetUserIdQueryVariables,
  GetUserIdDocument
} from 'skiff-front-graphql';
import { getPaywallErrorCode, PermissionLevel, RequestStatus, TeamAccess } from 'skiff-graphql';
import { assert, assertExists, filterExists } from 'skiff-utils';
import isEmail from 'validator/lib/isEmail';
import isUUID from 'validator/lib/isUUID';

import { requireCurrentUserData } from '../../apollo';
import useCurrentOrganization from '../../hooks/useCurrentOrganization';
import { useDocumentWithoutContent } from '../../hooks/useDocument';
import { ClientPermissionEntry } from '../../types';
import {
  encryptPrivateHierarchicalKeyForUser,
  fetchPublicKeysFromUserIDs,
  signEncryptedPrivateHierarchicalKey
} from '../documentUtils/docCryptoUtils';
import { upgradeDocKey, wrapDocumentOperation } from '../documentUtils/documentOperationUtils';
import { downloadDocument } from '../documentUtils/downloadDocument';
import { setupLink } from '../documentUtils/setupDocLink';
import { MAIL_DOMAIN } from '../getMailDomain';
import { formatUsernameAndCheckExists } from '../userUtils';

import { ExpireEntry, ShareDocWithUsersRequest, ShareDocWithUsersReturn } from './shareDocUtils.types';

export enum InviteErrorMessage {
  SelfInvite = 'You are already shared on this document.',
  AlreadyShared = 'User already has access to this document.',
  Invalid = 'Invalid Skiff or email address entered.',
  FailedOrganization = 'Failed to invite members to your organization. If sharing a wallet address, make sure they have registered on Skiff.',
  FailedDocument = 'Failed to invite members to your document. If sharing a wallet address, make sure they have registered on Skiff.'
}

/**
 *
 * Given the symmetric key for a link, create a URL to access the document.
 * @param {ClientLinkOutput} linkData - Link data containing link secret and permission level.
 * @param {DocID} linkDocID - DocID for document for link sharing.
 * @returns {string} Link URL.
 */
export function convertLinkDataIntoURL(decryptedLinkKey: string, linkDocID: string) {
  if (!window.location) {
    // true in React Native
    return `https://app.skiff.com/docs/${linkDocID}#${encodeURIComponent(decryptedLinkKey)}`;
  }
  const linkURL = `${window.location.protocol}//${window.location.host}/docs/${linkDocID}#${encodeURIComponent(
    decryptedLinkKey
  )}`;
  return linkURL;
}

/**
 * IMPORTANT: This primarily serves as a helper function to the exported share functions below
 * This should ONLY be used if we know the user will be a Skiff user and should be internally shared (e.g. AccessLevelSelect)
 * If unsure which share function to use, reach out to Nick or Andrew
 *
 * Shares a given document (specified by docID) with an array of users.
 * Each other user's new permission is specified by an entry in a permission entries array.
 * Documents are shared recursively.
 * @param {User} userData - User data for user sharing document.
 * @param {Document} document - Document to share
 * @param {Array<UserID>} collaboratorUserIDs - Array of userIDs.
 * @param {Array<ClientPermissionEntry>} permissionEntries - Array of permission entries for each user.
 * @returns {Promise<boolean>} Success/failure status.
 */
export async function shareDocWithSkiffUser(
  client: ApolloClient<NormalizedCacheObject>,
  userData: models.User,
  docID: string,
  clientPermissionEntries: Array<ClientPermissionEntry>,
  refetchDocID?: string,
  forceCurDecryptedPrivateHierarchicalKey?: string
): Promise<boolean | null> {
  return wrapDocumentOperation(client, [docID], async ([document]) => {
    const collaboratorPublicKeys = await fetchPublicKeysFromUserIDs(
      client,
      clientPermissionEntries.map(({ userID }) => userID),
      userData.privateDocumentData?.verifiedKeys?.keys || {}
    );
    if (!collaboratorPublicKeys) {
      console.error('Attempted share with user whose public key was unfetchable. User may not exist');
      return false;
    }

    // doc might have been deleted but left over in children field of parent
    assertExists(document, `Document ${docID} does not exist`);
    assert(document.currentUserPermissionLevel !== PermissionLevel.Viewer);

    if (!document.hierarchicalPermissionChain[0]?.encryptedSessionKey) {
      // document was created before we introduced encryptedSessionKey in Document, in this case, upgrade the document key first to populate this field
      await upgradeDocKey(client, docID);
      return shareDocWithSkiffUser(
        client,
        userData,
        docID,
        clientPermissionEntries,
        refetchDocID,
        forceCurDecryptedPrivateHierarchicalKey
      );
    }

    // Prepare request for this doc
    const { decryptedPrivateHierarchicalKey } = document;
    // Create permission entries
    const newPermissionEntries = collaboratorPublicKeys.map((collaboratorPublicKey, idx) => {
      const curPermissionEntry = clientPermissionEntries[idx];
      assertExists(collaboratorPublicKey);
      const encryptedPrivateHierarchicalKey = encryptPrivateHierarchicalKeyForUser(
        forceCurDecryptedPrivateHierarchicalKey || decryptedPrivateHierarchicalKey,
        collaboratorPublicKey,
        userData.privateUserData.privateKey
      );
      const fullEntry: PermissionEntryInput = {
        ...curPermissionEntry,
        encryptedPrivateHierarchicalKey: encryptedPrivateHierarchicalKey,
        encryptedBy: userData.publicKey
      };
      return fullEntry;
    });
    // Sign permission entries
    const signatures = newPermissionEntries.map((newPermissionEntry, idx) => {
      const curPermissionEntry = clientPermissionEntries[idx];
      return signEncryptedPrivateHierarchicalKey(
        newPermissionEntry.encryptedPrivateHierarchicalKey,
        userData.privateUserData.signingPrivateKey,
        curPermissionEntry
      );
    });

    await client.mutate<ShareDocMutation, ShareDocMutationVariables>({
      mutation: ShareDocDocument,
      variables: {
        request: {
          docID: document.docID,
          newPermissionEntries,
          signatures,
          currentPublicHierarchicalKey: document.publicHierarchicalKey
        }
      },
      refetchQueries: refetchDocID
        ? [{ query: GetDocumentFullDocument, variables: { request: { docID: refetchDocID } } }]
        : undefined
    });

    return true;
  });
}

export const canShareUsers = (userPrivilege: PermissionLevel | undefined): boolean => {
  if (!userPrivilege || userPrivilege === PermissionLevel.Viewer) {
    return false;
  }
  return true;
};

/**
 * IMPORTANT: This serves as a helper function to the exported share functions below

 * Share a doc with a non-Skiff user.
 * @param docID - Document ID.
 * @param username - Username to share.
 * @param permissionLevel - Permission level.
 * @param refetchDocID - Document ID to refetch after sharing.
 */
async function shareDocWithNonSkiffUser(
  client: ApolloClient<NormalizedCacheObject>,
  docID: string,
  email: string,
  permissionLevel: PermissionLevel,
  refetchDocID?: string,
  userObj?: models.User
) {
  const updatedDoc = await downloadDocument(client, docID, undefined, userObj);
  if (!updatedDoc?.link?.decryptedLinkKey) {
    await setupLink(client, docID, permissionLevel, userObj);
  }
  const redownloadedDoc = await downloadDocument(client, docID, undefined, userObj);
  if (!redownloadedDoc?.link?.decryptedLinkKey) {
    throw new Error('Could not create link');
  }
  const linkURL = convertLinkDataIntoURL(redownloadedDoc?.link.decryptedLinkKey, docID);
  const { data, errors } = await client.mutate<AddPendingInviteMutation, AddPendingInviteMutationVariables>({
    mutation: AddPendingInviteDocument,
    variables: {
      request: {
        docID,
        email,
        permissionLevel,
        documentLink: linkURL
      }
    },
    errorPolicy: 'all',
    refetchQueries: [{ query: GetDocumentFullDocument, variables: { request: { docID: refetchDocID || docID } } }]
  });
  if (errors) {
    const paywallErrorCode = getPaywallErrorCode(errors);
    if (paywallErrorCode) throw errors[0];
  }
  const status = data?.addPendingInvite.status;
  if (status === RequestStatus.Rejected) {
    throw new Error(InviteErrorMessage.Invalid);
  } else if (status === RequestStatus.Failed) {
    throw new Error('Request failed, please try again later.');
  }
}

export async function getUsersToShare(
  client: ApolloClient<NormalizedCacheObject>,
  users: string[],
  activeDoc: ReturnType<typeof useDocumentWithoutContent>,
  activeOrg: ReturnType<typeof useCurrentOrganization>
) {
  // external emails
  const externalInviteUsers: string[] = [];
  // userIDs
  const internalShareUsers: { usernameOrEmail: string; uuid: string }[] = [];
  // no org data yet
  if (!activeOrg.data || !activeDoc.data) {
    return {
      externalInviteUsers,
      internalShareUsers
    };
  }
  const activeDocObj = activeDoc.data.document;
  for (let idx = 0; idx < users.length; idx++) {
    let recipientUserID: string | undefined;
    if (isUUID(users[idx])) {
      // set userID
      recipientUserID = users[idx];
    }
    let usernameToCheck = users[idx];
    // uuid not set yet
    if (!recipientUserID) {
      const { formattedUsername: usernameData } = await formatUsernameAndCheckExists(client, usernameToCheck);
      if (!usernameData) {
        // to get an external invite
        externalInviteUsers.push(users[idx]);
        continue;
      } else {
        // update the username in case it is coming from a skemail alias
        usernameToCheck = usernameData;
      }
    }
    // user exists - determine whether internal or external share
    // TODO - there is a dual query here with formatUsernameAndCheckExists
    if (!recipientUserID) {
      const { data } = await client.query<GetUserIdQuery, GetUserIdQueryVariables>({
        query: GetUserIdDocument,
        variables: { request: { username: usernameToCheck } },
        fetchPolicy: 'network-only'
      });
      if (!data.user?.userID) {
        // need to find the user to continue
        continue;
      }
      // set the uuid and keep going
      recipientUserID = data.user.userID;
    }

    const isTeamRoot = activeDocObj?.team?.rootDocument?.docID === activeDocObj?.docID;
    if (!isTeamRoot) {
      // not team root, just share the doc
      internalShareUsers.push({ usernameOrEmail: users[idx], uuid: recipientUserID });
      continue;
    }
    // doc is team root - if invite only and user in org, share
    // otherwise external share
    const orgCollaborators =
      activeOrg.data?.organization.everyoneTeam?.rootDocument?.collaborators.map((collab) => collab.user.userID) ?? [];
    const recipientSharedOnOrg = orgCollaborators.includes(recipientUserID);
    if (recipientSharedOnOrg && activeDocObj?.team?.accessLevel === TeamAccess.InviteOnly) {
      // internal share of the team
      internalShareUsers.push({ usernameOrEmail: users[idx], uuid: recipientUserID });
    } else if (!recipientSharedOnOrg) {
      // recipient not shared on org, external share
      if (isEmail(users[idx])) {
        externalInviteUsers.push(users[idx]);
      } else {
        // uuid or username - potential error path
        externalInviteUsers.push(users[idx]);
        console.error('Pushing username/uuid to share', usernameToCheck);
      }
    }
    // else case is public team - do nothing
  }
  return { externalInviteUsers, internalShareUsers };
}

export async function shareDocWithUsers(
  client: ApolloClient<NormalizedCacheObject>,
  shareDocRequests: ShareDocWithUsersRequest[],
  activeDoc: ReturnType<typeof useDocumentWithoutContent>,
  activeOrg: ReturnType<typeof useCurrentOrganization>,
  refetchDocID?: string,
  userObj?: models.User,
  forceCurDecryptedPrivateHierarchicalKey?: string
): Promise<ShareDocWithUsersReturn> {
  const curUserData = userObj ?? requireCurrentUserData();

  if (!activeDoc.data || !activeOrg.data) {
    return {};
  }

  const users = shareDocRequests.map((req) => req.userEmailOrID);

  const { externalInviteUsers, internalShareUsers } = await getUsersToShare(client, users, activeDoc, activeOrg);
  let shareSucceeded = true;
  const skiffUserEntries: ClientPermissionEntry[] = internalShareUsers
    .map(({ uuid, usernameOrEmail }) => {
      const internalUserShareRequest = shareDocRequests.find(
        ({ userEmailOrID }) =>
          userEmailOrID === usernameOrEmail ||
          userEmailOrID === uuid ||
          `${usernameOrEmail}@${MAIL_DOMAIN}` === userEmailOrID
      );
      if (!internalUserShareRequest) {
        console.error('Could not share with internal user:', usernameOrEmail);
        shareSucceeded = false;
        return undefined;
      }
      return { userID: uuid, permissionLevel: internalUserShareRequest.permissionLevel };
    })
    .filter(filterExists);

  const docID = activeDoc?.data?.document?.docID;
  const isTeamRoot = activeDoc?.data?.document?.team?.rootDocument?.docID === docID;
  // share docID with internal users, but external must get everyone team because they aren't signed up
  const docIDToShareExternal = isTeamRoot ? activeOrg.data.organization.everyoneTeam.rootDocument?.docID : docID;

  if ((!docIDToShareExternal && externalInviteUsers.length > 0) || !docID) {
    console.error('Could not share team');
    return {};
  }

  if (skiffUserEntries.length > 0) {
    const status = await shareDocWithSkiffUser(
      client,
      curUserData,
      docID,
      skiffUserEntries,
      refetchDocID,
      forceCurDecryptedPrivateHierarchicalKey
    );
    if (!status) {
      return {};
    }
  }

  try {
    await Promise.all(
      shareDocRequests
        .filter(({ userEmailOrID }) => externalInviteUsers.includes(userEmailOrID))
        .map(async ({ userEmailOrID: userEmail, permissionLevel }) => {
          if (docIDToShareExternal) {
            await shareDocWithNonSkiffUser(
              client,
              docIDToShareExternal,
              userEmail,
              isTeamRoot ? PermissionLevel.Editor : permissionLevel,
              refetchDocID,
              userObj
            );
          }
        })
    );
    return { shareSucceeded };
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paywallErrorCode = getPaywallErrorCode([e] as any[]);
    if (paywallErrorCode) {
      return { paywallErrorCode: paywallErrorCode };
    }
    console.error(e);
    return {};
  }
}

/**
 * Changes a user's (curUserID) expiration on a given document (curDocID) to a new date.
 * If the newDate is null, the user's expiry date is removed from the document.
 * @param {User} userData - the user who is removing the expiry date.
 * @param {docID} docID - Document ID to share
 * @param {ExpireEntry} expireEntry - new expiration date settings (date, userID, and permission level)
 */
export async function changeUserExpiry(
  client: ApolloClient<NormalizedCacheObject>,
  userData: models.User,
  docID: string,
  expireEntry: ExpireEntry
) {
  const { newDate, collabUserID, permissionLevel } = expireEntry;
  const now = new Date();
  if (newDate && newDate < now) {
    // date invalid
    return;
  }

  const newPermissionEntry: ClientPermissionEntry = {
    permissionLevel,
    expiryDate: newDate,
    userID: collabUserID
  };
  await shareDocWithSkiffUser(client, userData, docID, [newPermissionEntry]);
}
