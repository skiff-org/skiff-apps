import dayjs from 'dayjs';
import concat from 'lodash/concat';
import {
  SetReadStatusDocument,
  SetReadStatusMutation,
  SetReadStatusMutationVariables,
  SetAllThreadsReadStatusDocument,
  SetAllThreadsReadStatusMutation,
  SetAllThreadsReadStatusMutationVariables,
  ThreadWithoutContentFragment,
  ThreadWithoutContentFragmentDoc
} from 'skiff-front-graphql';
import { filterExists } from 'skiff-utils';

import client from '../apollo/client';
import { ITEM_HEIGHT, MOBILE_ITEM_HEIGHT } from '../constants/mailbox.constants';
import { MailboxEmailInfo } from '../models/email';
import { MailboxThreadInfo } from '../models/thread';

import { updateLabelsNumUnreadCache } from './cache/cache';
import { cacheMarkAllRead, updateReadUnreadFilterThreads } from './cache/mailbox';
import { SYSTEM_LABELS } from './label';
import { SearchSkemail } from './searchWorkerUtils';

export const getItemHeight = (isMobile: boolean) => {
  if (isMobile) {
    return MOBILE_ITEM_HEIGHT;
  }
  return ITEM_HEIGHT;
};

export const markAllThreadsAsRead = async (read: boolean, label: string) => {
  await client.mutate<SetAllThreadsReadStatusMutation, SetAllThreadsReadStatusMutationVariables>({
    mutation: SetAllThreadsReadStatusDocument,
    variables: { request: { read, label } },
    update: (cache, response) => {
      if (response.errors) {
        console.error(`Failed to mark all as read. ${response.errors}`);
        return;
      }
      cacheMarkAllRead(cache, read);
      SYSTEM_LABELS.forEach((sysLabel) => {
        updateReadUnreadFilterThreads(cache, sysLabel.name, { read: true });
        updateReadUnreadFilterThreads(cache, sysLabel.name, { read: false });
      });
    }
  });
};

export const updateThreadAsReadUnread = async (threadIDs: Array<string>, read: boolean, labelsToUpdate: string[]) => {
  await client.mutate<SetReadStatusMutation, SetReadStatusMutationVariables>({
    mutation: SetReadStatusDocument,
    variables: { request: { threadIDs, read } },
    optimisticResponse: {
      setReadStatus: { updatedThreadIDs: threadIDs, __typename: 'SetReadStatusResponse' }
    },
    update: (cache, response) => {
      if (response.errors) {
        console.error(
          `There was an error with marking selected as ${read ? 'read' : 'unread'}, will not update the cache`
        );
        return;
      }

      const labelsUnreadDiff: Map<string, number> = new Map();
      const diff = read ? -1 : 1;

      const updatedThreadIDs = response?.data?.setReadStatus?.updatedThreadIDs ?? [];
      updatedThreadIDs.forEach((threadID) => {
        const cacheID = cache.identify({ __typename: 'UserThread', threadID });
        cache.updateFragment<ThreadWithoutContentFragment>(
          { id: cacheID, fragment: ThreadWithoutContentFragmentDoc, fragmentName: 'ThreadWithoutContent' },
          (existingThread) => {
            if (!existingThread) {
              return null;
            }

            // User labels are unique by their id and system labels by their names
            if (existingThread.attributes.read !== read) {
              existingThread.attributes.userLabels.forEach(({ labelID }) => {
                const currentUnreadCount = labelsUnreadDiff.get(labelID) ?? 0;
                labelsUnreadDiff.set(labelID, currentUnreadCount + diff);
              });

              existingThread.attributes.systemLabels.forEach((labelName) => {
                const currentUnreadCount = labelsUnreadDiff.get(labelName) ?? 0;
                labelsUnreadDiff.set(labelName, currentUnreadCount + diff);
              });
            }

            return {
              ...existingThread,
              attributes: {
                ...existingThread.attributes,
                read
              }
            };
          }
        );
      });

      updateLabelsNumUnreadCache(client.cache, labelsUnreadDiff);

      labelsToUpdate.forEach((label) => {
        // For each label, update the threads for READ and UNREAD
        updateReadUnreadFilterThreads(cache, label, { read: true });
        updateReadUnreadFilterThreads(cache, label, { read: false });
        // No need to update no filter requests since we won't be adding or removing threads
      });
    }
  });
};

// Get the previous senders of the current thread, in order of depth
export const getThreadSenders = (thread: MailboxThreadInfo) =>
  thread.emails
    .map(({ from: { name, address } }) => name || address)
    .filter(filterExists)
    .reverse();

export const getReplyOrForwardFromAddress = (
  email: MailboxEmailInfo,
  emailAliases: string[],
  defaultEmailAlias?: string
) => {
  // Priority for determining from address
  //   1. Default email alias if it exists in to, cc, or bcc
  //   2. Other email alias if it exists in to, cc, or bcc
  //   3. Use default email alias
  const { to, cc, bcc } = email;
  const aliasesSet = new Set(concat(to, cc, bcc).map(({ address }) => address));
  if (defaultEmailAlias && aliasesSet.has(defaultEmailAlias)) {
    return defaultEmailAlias;
  }

  const otherEmailAliasInTo = emailAliases.find((alias) => aliasesSet.has(alias));
  if (otherEmailAliasInTo) {
    return otherEmailAliasInTo;
  }

  return defaultEmailAlias;
};

// Returns true if threads arrays are the same
export const threadsEqual = (a: MailboxThreadInfo[] | SearchSkemail[], b: MailboxThreadInfo[] | SearchSkemail[]) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; ++i) {
    if (a[i]?.threadID !== b[i]?.threadID) return false;
  }
  return true;
};

export const userLabelsEqual = (a: string[], b: string[]) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export const getScheduledSendAtDateForThread = (emails: MailboxEmailInfo[]) => {
  const now = dayjs();

  // get the first email in the thread that has a scheduled send date that is in the future
  // first email = one with that earliest date in the future
  const emailToSend = emails.find((email) => email.scheduleSendAt && dayjs(email.scheduleSendAt).isAfter(now));
  return emailToSend?.scheduleSendAt;
};
