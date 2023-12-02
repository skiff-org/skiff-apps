import { useMemo } from 'react';

import { useAppSelector } from './redux/useAppSelector';
import { useThreadActions } from './useThreadActions';

/**
 * Effective threads are the threads on which mailbox actions should be applied
 * The function returns the user-selected threads if they exist
 * Otherwise, it returns the currently active (open) thread
 */
export const useGetEffectiveThreadIDs = () => {
  const { activeThreadID } = useThreadActions();

  const { selectedThreadIDs } = useAppSelector((state) => state.mailbox);

  const effectiveThreadIDs = useMemo(() => {
    // Prioritize selected threads over the curr active thread
    if (!!selectedThreadIDs.length) return selectedThreadIDs;
    return activeThreadID ? [activeThreadID] : [];
  }, [activeThreadID, selectedThreadIDs]);

  return effectiveThreadIDs;
};
