import { Dispatch } from '@reduxjs/toolkit';

import { skemailMailboxReducer } from '../../../redux/reducers/mailboxReducer';

export const threadIsSelected = (currSelectedIDs: string[], threadID: string) => currSelectedIDs.includes(threadID);

/**
 * Toggle thread selected
 * @param dispatch dispatch
 * @param threadID the threadID to toggle
 * @param isSelected is the thread selected or not
 */
export const toggleThreadSelect = (dispatch: Dispatch<any>, threadID: string, isSelected: boolean) => {
  if (isSelected) {
    // Filter out threadID from selectedThreadIDs
    dispatch(skemailMailboxReducer.actions.removeSelectedThreadID(threadID));
  } else {
    // Else, add just this thread to the array of selected emails
    dispatch(skemailMailboxReducer.actions.addSelectedThreadID(threadID));
  }
};
