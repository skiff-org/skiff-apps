import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  GetUserIdDocument,
  GetUserIdQuery,
  GetUserIdQueryVariables,
  useGetCollaboratorsQuery
} from 'skiff-front-graphql';
import { PaywallErrorCode } from 'skiff-utils';
import isEmail from 'validator/lib/isEmail';
import isUUID from 'validator/lib/isUUID';

import { useRequiredCurrentUserData } from '../apollo';
import {
  InviteErrorMessage,
  shareDocWithSkiffUser,
  shareDocWithUsers,
  ShareDocWithUsersRequest
} from '../utils/sharingUtils';
import { formatUsernameAndCheckExists } from '../utils/userUtils';

import useCurrentOrganization from './useCurrentOrganization';
import { useDocumentWithoutContent } from './useDocument';
import useToast from './useToast';

export interface InviteReturn {
  error: InviteErrorMessage | PaywallErrorCode | null;
}

const useShareDocument = (client: ApolloClient<NormalizedCacheObject>, docID: string) => {
  const userData = useRequiredCurrentUserData();
  const { username: currentUsername, userID: currentUserID } = userData;

  const { enqueueToast } = useToast();

  const { data } = useGetCollaboratorsQuery({ variables: { request: { docID } }, skip: !docID });

  const activeOrgData = useCurrentOrganization();

  const docData = useDocumentWithoutContent(docID, client);

  // check if the entered user is valid
  const validateEntry = (entry: string | undefined): InviteReturn => {
    if (!entry) {
      return { error: InviteErrorMessage.Invalid };
    }
    // user is trying to share themselves on the document
    if (entry === currentUsername || entry === currentUserID) {
      return { error: InviteErrorMessage.SelfInvite };
    }
    // User already has access to this document
    if (
      data?.document?.collaborators.some(
        (collaborator) => collaborator.user.userID === entry || collaborator.user.username === entry
      )
    ) {
      return { error: InviteErrorMessage.AlreadyShared };
    }
    if (!isEmail(entry) && !isUUID(entry)) {
      return { error: InviteErrorMessage.Invalid };
    }
    return { error: null };
  };

  const shareUsers = async (shareRequests: ShareDocWithUsersRequest[]): Promise<InviteReturn> => {
    const { shareSucceeded, paywallErrorCode } = await shareDocWithUsers(client, shareRequests, docData, activeOrgData);
    if (shareSucceeded) {
      return { error: null };
    } else if (paywallErrorCode) {
      return { error: paywallErrorCode };
    } else {
      return { error: InviteErrorMessage.FailedDocument };
    }
  };

  // Important: Currently only supports a UUID entry
  const updateUserDocPermission = async (shareRequest: ShareDocWithUsersRequest) => {
    const { userEmailOrID, permissionLevel } = shareRequest;
    let userID = null;

    const showErrorToast = () =>
      enqueueToast({ title: 'Permissions update failed', body: `Failed to updated user's permissions.` });

    // If we already have the userID, use it
    if (isUUID(userEmailOrID)) {
      userID = userEmailOrID;
      // If we're given an email, attempt to find the userID for that user
    } else {
      const { formattedUsername: username } = await formatUsernameAndCheckExists(client, userEmailOrID);

      if (!username) {
        console.error('Failed to update user permissions: valid username not found');
        showErrorToast();
        return;
      }

      const { data: userIDData } = await client.query<GetUserIdQuery, GetUserIdQueryVariables>({
        query: GetUserIdDocument,
        variables: { request: { username } },
        fetchPolicy: 'network-only'
      });

      if (!userIDData.user?.userID) {
        // need to find the user to continue
        console.error('Failed to update user permissions: userID not found');
        showErrorToast();
        return;
      }

      userID = userIDData.user?.userID;
    }

    // Note: Using this rather than shareDocWithUsers
    // since we want to bypass the internal/external check to update permissions
    await shareDocWithSkiffUser(client, userData, docID, [{ userID: userID, permissionLevel }]);
  };

  return {
    validateEntry,
    shareUsers,
    updateUserDocPermission
  };
};

export default useShareDocument;
