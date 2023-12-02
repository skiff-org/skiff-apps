import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { skemailMailboxReducer } from '../redux/reducers/mailboxReducer';

import { useAppSelector } from './redux/useAppSelector';
import { useThreadActions } from './useThreadActions';

/**
 * Updates the next and previous active thread IDs in a mailbox.
 * Calculates and sets the IDs of the threads immediately following and preceding the currently active thread.
 * It ensures that these IDs are not part of the selected threads and are different from the active thread ID.
 * Necessary for mailbox thread navigation.
 */
export const useUpdateNextAndPrevActiveIDs = (threadIDs: string[]) => {
  const dispatch = useDispatch();
  const { activeThreadID } = useThreadActions();
  const { nextActiveThreadID, prevActiveThreadID, selectedThreadIDs } = useAppSelector((state) => state.mailbox);

  const numThreads = threadIDs.length;

  // Gets thread ID from offset, skipping selected and active threads.
  const getThreadIDFromOffset = useCallback(
    (currIndex: number, offset: number) => {
      let threadIndex = currIndex + offset;
      let threadID = threadIDs[threadIndex];

      // Loops until a non-selected, non-active thread ID is found.
      while (!!threadID && selectedThreadIDs.includes(threadID) && threadID !== activeThreadID) {
        threadIndex += offset;
        threadID = threadIDs[threadIndex];
      }

      // Avoid returning the active thread ID.
      return threadID === activeThreadID ? undefined : threadID;
    },
    [activeThreadID, selectedThreadIDs, threadIDs]
  );

  // Update next/prev active thread IDs when the active thread changes.
  useEffect(() => {
    let newNextThreadID: string | undefined = undefined;
    let newPrevThreadID: string | undefined = undefined;

    // Only assign next and previous active thread IDs if an active thread exists and the number of threads > 1.
    // Otherwise, they default to undefined.
    if (activeThreadID !== undefined && numThreads > 1) {
      const activeThreadIndex = threadIDs.indexOf(activeThreadID);

      // If the curr active thread is the last thread in the mailbox,
      // the next thread should be the thread preceding the curr active thread in order not to wrap around
      const nextThreadOffset = activeThreadIndex === numThreads - 1 ? -1 : 1;
      newNextThreadID = getThreadIDFromOffset(activeThreadIndex, nextThreadOffset);
      // If the curr active thread is the first thread in the mailbox,
      // the next thread should be the thread following the curr active thread in order not to wrap around
      const newPrevThreadOffset = activeThreadIndex === 0 ? 1 : -1;
      newPrevThreadID = getThreadIDFromOffset(activeThreadIndex, newPrevThreadOffset);
    }

    // Dispatch updates only if IDs have changed.
    if (nextActiveThreadID !== newNextThreadID)
      dispatch(skemailMailboxReducer.actions.setNextActiveThreadID(newNextThreadID));
    if (prevActiveThreadID !== newPrevThreadID)
      dispatch(skemailMailboxReducer.actions.setPrevActiveThreadID(newPrevThreadID));
  }, [
    activeThreadID,
    dispatch,
    getThreadIDFromOffset,
    nextActiveThreadID,
    numThreads,
    prevActiveThreadID,
    selectedThreadIDs,
    threadIDs
  ]);
};
