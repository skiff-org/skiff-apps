import { decryptSessionKey, decryptDatagram } from 'skiff-crypto-v2';
import {
  ApplyLabelsMutation,
  ApplyLabelsMutationVariables,
  ApplyLabelsDocument,
  GetMailFiltersDocument,
  GetMailFiltersQuery,
  MarkThreadsAsClientsideFilteredMutation,
  MarkThreadsAsClientsideFilteredMutationVariables,
  MarkThreadsAsClientsideFilteredDocument,
  EmailFragment,
  MailSubjectDatagram,
  MailTextDatagram,
  MailboxWithContentDocument,
  MailboxWithContentQuery
} from 'skiff-front-graphql';
import { requireCurrentUserData } from 'skiff-front-utils';
import { MailboxCursor, SystemLabels } from 'skiff-graphql';
import { filterExists } from 'skiff-utils';

import client from '../../apollo/client';
import { updateThreadAsReadUnread } from '../mailboxUtils';

import { UserLabelIDToThreadIDs, SystemLabelToThreadIDs } from './mailFiltering.types';

/** Pagination page size for fetching threads to apply filters on */
const THREAD_PAGINATION_LIMIT = 50;

export const isLabelSystemLabel = (label: string): label is SystemLabels =>
  Object.values(SystemLabels).includes(label as SystemLabels);

export const decryptEmailTextAndSubject = (email: EmailFragment) => {
  const currentUser = requireCurrentUserData();
  const { privateKey } = currentUser.privateUserData;

  const encryptedSessionKey = email.encryptedSessionKey;
  const sessionKey = decryptSessionKey(
    encryptedSessionKey?.encryptedSessionKey,
    privateKey,
    encryptedSessionKey?.encryptedBy
  );
  const text = decryptDatagram(MailTextDatagram, sessionKey, email.encryptedText.encryptedData).body.text || '';
  const subject =
    decryptDatagram(MailSubjectDatagram, sessionKey, email.encryptedSubject.encryptedData).body.subject || '';

  return { text, subject };
};

/******** Queries and mutations for mail filtering ***********/

/**
 * Get all threads that do not have the clientsideFilterApplied
 */
export const fetchUnfilteredThreads = async (cursor: MailboxCursor | null) =>
  client
    .query<MailboxWithContentQuery>({
      query: MailboxWithContentDocument,
      variables: {
        request: {
          limit: THREAD_PAGINATION_LIMIT,
          clientsideFiltersApplied: false,
          cursor
        }
      },
      fetchPolicy: 'no-cache'
    })
    .then((result) => result.data.mailbox);

/**
 * Get client side mail filters
 */
export const fetchClientsideFilters = () => {
  return client
    .query<GetMailFiltersQuery>({
      query: GetMailFiltersDocument,
      variables: {
        request: { clientside: true }
      },
      fetchPolicy: 'no-cache'
    })
    .then((result) => result.data.mailFilters);
};

/**
 * Given a dictionary of userLabelID to threadIDs, for each userLabelID, apply the
 * user label to the corresponding threadIDs
 */
export const applyUserLabelsToThreads = (labelToThreadIDs: UserLabelIDToThreadIDs) =>
  Object.entries(labelToThreadIDs).map(([userLabelID, threadIDs]) => {
    return client.mutate<ApplyLabelsMutation, ApplyLabelsMutationVariables>({
      mutation: ApplyLabelsDocument,
      variables: {
        request: {
          threadIDs,
          userLabels: [userLabelID]
        }
      }
    });
  });

/**
 * Given a dictionary of systemLabel to threadIDs, for each systemLabel, apply
 * it to the corresponding threadIDs
 */
export const applySystemLabelsToThreads = (systemLabelToThreadIDs: SystemLabelToThreadIDs) =>
  Object.entries(systemLabelToThreadIDs).map(([systemLabel, threadIDs]) => {
    if (!isLabelSystemLabel(systemLabel)) return;
    return client.mutate<ApplyLabelsMutation, ApplyLabelsMutationVariables>({
      mutation: ApplyLabelsDocument,
      variables: {
        request: {
          threadIDs,
          systemLabels: [systemLabel]
        }
      }
    });
  });

/**
 * Apply user labels and system labels to threads
 * @param userLabelToThreadIDs
 * @param systemLabelToThreadIDs
 * @returns all threadIDs that failed to either have a system label or user label applied
 */
export const applyLabelsToThreads = async (
  userLabelToThreadIDs: UserLabelIDToThreadIDs,
  systemLabelToThreadIDs: SystemLabelToThreadIDs
) => {
  // Apply user labels. We need to apply these before system labels as applying
  // user labels could overwrite the system labels on the thread
  const labelToThreadIDsArray = Object.entries(userLabelToThreadIDs);
  const threadIDsFailedToApplyUserLabels = await Promise.allSettled(
    applyUserLabelsToThreads(userLabelToThreadIDs)
  ).then((allResults) => {
    return allResults
      .flatMap((result, index) => {
        // Return threads that failed to get the label applied
        return result.status === 'rejected' && labelToThreadIDsArray[index]?.[1]
          ? labelToThreadIDsArray[index]?.[1]
          : [];
      })
      .filter(filterExists);
  });

  // Apply system labels
  const threadIDsFailedToApplySystemLabels = await Promise.allSettled(
    applySystemLabelsToThreads(systemLabelToThreadIDs)
  ).then((allResults) => {
    const systemLabelToThreadIDsArray = Object.entries(systemLabelToThreadIDs);
    return allResults
      .flatMap((result, index) => {
        // Return threads that failed to get moved to the system label
        return result.status === 'rejected' ? systemLabelToThreadIDsArray[index]?.[1] : [];
      })
      .filter(filterExists);
  });
  // TODO: better error handling for when trying to apply a label to a non existent label
  return [...threadIDsFailedToApplyUserLabels, ...threadIDsFailedToApplySystemLabels];
};

/**
 * Mark all given threadIDs as read
 * @param threadIDs threads to mark as read
 * @returns all threadsIDs that failed to be marked as read
 */
export const markThreadsAsRead = async (threadIDs: string[]): Promise<string[]> => {
  return updateThreadAsReadUnread(threadIDs, true, [])
    .then(() => [])
    .catch(() => threadIDs); // on error, return back the threadIDs
};

/**
 * Given a list of thread IDs, mark those threads as clientsideFiltersApplied = true
 * Marking them as true indicates that they will not be run through
 * the frontend mail filters
 */
export const markThreadsAsClientsideFiltered = async (threadIDs: string[]) =>
  client.mutate<MarkThreadsAsClientsideFilteredMutation, MarkThreadsAsClientsideFilteredMutationVariables>({
    mutation: MarkThreadsAsClientsideFilteredDocument,
    variables: {
      request: {
        threadIDs
      }
    }
  });
