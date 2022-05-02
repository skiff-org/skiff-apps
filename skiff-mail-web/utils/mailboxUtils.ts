import client from '../apollo/client';
import {
  MailboxDocument,
  MailboxQuery,
  SetReadStatusDocument,
  SetReadStatusMutation,
  SetReadStatusMutationVariables
} from '../generated/graphql';
import { MailboxThreadInfo } from '../models/thread';
import { filterExists } from './typeUtils';

export const updateThreadAsReadUnread = async (threadIDs: Array<string>, read: boolean, labelsToUpdate: string[]) => {
  await client.mutate<SetReadStatusMutation, SetReadStatusMutationVariables>({
    mutation: SetReadStatusDocument,
    variables: { request: { threadIDs, read } },
    update: (cache, response) => {
      if (response.errors) {
        console.error(
          `There was an error with marking selected as ${read ? 'read' : 'unread'}, will not update the cache`
        );
        return;
      }

      const updatedThreadIDs = response?.data?.setReadStatus?.updatedThreadIDs ?? [];
      // For each label, update the relevant threads under that label as read or unread in the cache
      labelsToUpdate.forEach((label) => {
        cache.updateQuery<MailboxQuery>(
          { query: MailboxDocument, variables: { request: { label } } },
          (existingCache) => ({
            ...existingCache,
            mailbox: {
              ...existingCache?.mailbox,
              threads: (existingCache?.mailbox?.threads ?? []).map((t) =>
                updatedThreadIDs.includes(t.threadID) ? { ...t, attributes: { ...t.attributes, read } } : t
              ),
              pageInfo: {
                cursor: existingCache?.mailbox?.pageInfo.cursor,
                hasNextPage: existingCache?.mailbox?.pageInfo.hasNextPage || false
              }
            }
          })
        );
      });
    }
  });
};

export const handleMarkAsReadUnreadClick = (threads: Array<MailboxThreadInfo>, read: boolean) => {
  // Group threadIds by label
  const labelsToUpdate = threads.reduce((allLabels, thread) => {
    thread.attributes.systemLabels.forEach((label) => {
      if (!allLabels.includes(label)) allLabels.push(label);
    });
    return allLabels;
  }, [] as string[]);

  // For each label, update the relevant threads IDs as read/unread
  return updateThreadAsReadUnread(
    threads.map((t) => t.threadID),
    read,
    labelsToUpdate
  );
};

// Get the previous senders of the current thread, in order of depth
export const getThreadSenders = (thread: MailboxThreadInfo) =>
  thread.emails
    .map(({ from: { name, address } }) => name || address)
    .filter(filterExists)
    .reverse();
