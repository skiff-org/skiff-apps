import uniq from 'lodash/uniq';
import { ThreadFragment } from 'skiff-front-graphql';
import { requireCurrentUserData, aggregateMailFilterActionsForThreads } from 'skiff-front-utils';
import { MailboxCursor } from 'skiff-graphql';
import { filterExists } from 'skiff-utils';

import {
  applyLabelsToThreads,
  decryptEmailTextAndSubject,
  fetchClientsideFilters,
  fetchUnfilteredThreads,
  markThreadsAsClientsideFiltered,
  markThreadsAsRead
} from './mailFiltering.utils';

/**
 * Run all unfiltered threads through the client side mail filters
 */
export const runClientSideMailFilters = async () => {
  const currentUser = requireCurrentUserData();
  const { privateKey } = currentUser.privateUserData;
  let cursor: MailboxCursor | null = null;

  let numThreadsFiltered = 0;
  try {
    // Get all client side mail filters
    const clientSideFilters = await fetchClientsideFilters();

    // Continue paginating through the threads that have not yet run through
    // the client side filters until there are no more
    while (true) {
      // fetch for all threads where we have not yet applied client side filters
      const mailboxData = await fetchUnfilteredThreads(cursor);
      const threadsToApplyFilterTo: ThreadFragment[] = mailboxData?.threads ?? [];
      // if there are none, break
      if (!threadsToApplyFilterTo.length) {
        break;
      }

      // For each thread that we need to run through the client side filters,
      // extract out the necessary info to determine whether or not the thread
      // matches the filter
      const threadsToFilterInfo = threadsToApplyFilterTo
        .map((thread) => {
          const { threadID, emails } = thread;
          const latestEmail = emails[emails.length - 1];
          if (!latestEmail) return undefined;
          const { text: decryptedText, subject: decryptedSubject } = decryptEmailTextAndSubject(latestEmail);
          return {
            id: threadID,
            aliases: {
              from: latestEmail.from.address,
              to: latestEmail.to.map((t) => t.address),
              cc: latestEmail.cc.map((c) => c.address),
              bcc: latestEmail.bcc.map((b) => b.address)
            },
            latestEmail: {
              decryptedText,
              decryptedSubject,
              id: latestEmail.id
            }
          };
        })
        .filter(filterExists);

      // run the client side filters on those threads
      const { userLabelToThreadIDs, systemLabelToThreadIDs, threadsToMarkAsRead } =
        aggregateMailFilterActionsForThreads(threadsToFilterInfo, clientSideFilters, privateKey);

      // take the appropriate actions for those threads: apply label, mark as read/unread
      // these will return the threadIDs that it failed to apply actions to,
      // which we will use later to determine which threads to mark as successfully having
      // client side filter applied
      const [threadIDsThatFailedToApplyLabels, threadIDsThatFailedToMarkAsRead] = await Promise.all([
        applyLabelsToThreads(userLabelToThreadIDs, systemLabelToThreadIDs),
        markThreadsAsRead(threadsToMarkAsRead)
      ]);

      // Determine which threads had an action had failed to execute
      const allThreadIDs = threadsToApplyFilterTo.map((thread) => thread.threadID);
      const threadIDsThatFailedToApplyAction = uniq([
        ...threadIDsThatFailedToApplyLabels,
        ...threadIDsThatFailedToMarkAsRead
      ]);
      // Determine the threads that had all actions applied
      const successfullyFilteredThreadIDs = allThreadIDs.filter(
        (threadID) => !threadIDsThatFailedToApplyAction.includes(threadID)
      );
      // Update the successfullyFilteredThreadIDs to be marked as clientsideFilterApplied = true
      // so that they are not run through the front end filters again (until a new email is received
      // on that thread)
      if (successfullyFilteredThreadIDs.length) {
        await markThreadsAsClientsideFiltered(successfullyFilteredThreadIDs);
        numThreadsFiltered += successfullyFilteredThreadIDs.length;
      }

      // update cursor to fetch the next page
      cursor = !!mailboxData?.pageInfo.cursor
        ? { threadID: mailboxData.pageInfo.cursor.threadID, date: mailboxData.pageInfo.cursor.date }
        : null;

      // No more threads to fetch
      if (!mailboxData?.pageInfo.hasNextPage) break;
    }
  } catch (e) {
    console.error(e);
  }
  return numThreadsFiltered;
};
