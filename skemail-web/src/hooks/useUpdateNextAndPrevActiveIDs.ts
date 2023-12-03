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

  // Helper function to conditionally dispatch updates.
  const dispatchUpdate = (action, newID) => {
    if (action !== newID) {
      dispatch(action(newID));
    }
  };

  // Update next/prev active thread IDs when the active thread changes.
  useEffect(() => {
    if (activeThreadID === undefined || numThreads <= 1) {
      // No need to proceed if there is no active thread or only one thread.
      return;
    }

    const activeThreadIndex = threadIDs.indexOf(activeThreadID);

    // Calculate next and previous thread IDs.
    const nextThreadOffset = activeThreadIndex === numThreads - 1 ? -1 : 1;
    const newNextThreadID = getThreadIDFromOffset(activeThreadIndex, nextThreadOffset);

    const newPrevThreadOffset = activeThreadIndex === 0 ? 1 : -1;
    const newPrevThreadID = getThreadIDFromOffset(activeThreadIndex, newPrevThreadOffset);

    // Dispatch updates only if IDs have changed.
    dispatchUpdate(skemailMailboxReducer.actions.setNextActiveThreadID, newNextThreadID);
    dispatchUpdate(skemailMailboxReducer.actions.setPrevActiveThreadID, newPrevThreadID);
  }, [activeThreadID, 
      dispatch, 
      getThreadIDFromOffset, 
      numThreads, 
      selectedThreadIDs, 
      threadIDs
    ]);
};
