import { useCallback, useEffect, useState } from 'react';

import { MailboxThreadInfo } from '../models/thread';
import { updateThreadAsReadUnread } from '../utils/mailboxUtils';

import { useThreadActions } from './useThreadActions';

/**
 * Returns an object containing a util function to mark threads as read / unread
 * as well as the loading state for the mark as read / unread process
 */
export const useMarkAsReadUnread = () => {
  // Whether the threads need to be marked as read / unread
  // True indicates mark as read, False indicates mark as unread
  const [markAsRead, setMarkAsRead] = useState(false);
  // The threads selected to be marked as read / unread
  // The mark as read / unread process is pending as long as selectedThreads is not undefined
  const [selectedThreads, setSelectedThreads] = useState<MailboxThreadInfo[] | undefined>(undefined);

  const { activeThreadID, setActiveThreadID } = useThreadActions();
  // Whether the current active thread is included in the threads that the user is marking as read / unread
  const isActiveThreadIncluded = selectedThreads?.some((thread) => thread.threadID === activeThreadID);

  const markThreadsAsReadUnread = (threads: MailboxThreadInfo[], read: boolean) => {
    setSelectedThreads(threads);
    setMarkAsRead(read);
  };

  // Groups threads by their labels
  const getThreadLabels = useCallback(
    (threads: MailboxThreadInfo[]) =>
      threads.reduce((allLabels, thread) => {
        thread.attributes.systemLabels.forEach((label) => {
          if (!allLabels.includes(label)) allLabels.push(label);
        });
        return allLabels;
      }, [] as string[]),
    []
  );

  // If the user is marking threads as unread
  // and one of these threads is the current active thread,
  // we close the active thread first before calling mark as unread
  useEffect(() => {
    if (!markAsRead && isActiveThreadIncluded) setActiveThreadID(undefined);
  }, [markAsRead, isActiveThreadIncluded, setActiveThreadID]);

  useEffect(() => {
    // Return if there are no selected threads
    // or if the user is marking threads as unread and they include the active thread
    // but the active thread hasn't been closed yet
    if (!selectedThreads || (!markAsRead && !!activeThreadID && !!isActiveThreadIncluded)) return;
    const handler = async () => {
      const labelsToUpdate = getThreadLabels(selectedThreads);
      // For each label, update the relevant threads IDs as read / unread
      await updateThreadAsReadUnread(
        selectedThreads.map((thread) => thread.threadID),
        markAsRead,
        labelsToUpdate
      );
      // Has to be reset to indicate that the mutation has finished
      setSelectedThreads(undefined);
    };
    void handler();
  }, [activeThreadID, markAsRead, selectedThreads, isActiveThreadIncluded, getThreadLabels]);

  return { markThreadsAsReadUnread, isLoading: !!selectedThreads };
};
