import { skemailMailboxReducer } from '../../../redux/reducers/mailboxReducer';
import { AppDispatch } from '../../../redux/store/reduxStore';
import { MailboxMultiSelectFilter } from '../../../utils/mailboxActionUtils';

export const threadIsSelected = (currSelectedIDs: string[], threadID: string) => currSelectedIDs.includes(threadID);

/**
 * Toggle thread selected
 * @param dispatch dispatch
 * @param threadID the threadID to toggle
 * @param isSelected is the thread selected or not
 */
export const toggleThreadSelect = (
  dispatch: AppDispatch,
  threadID: string,
  isSelected: boolean,
  activeSelectFilter?: MailboxMultiSelectFilter
) => {
  // any time a user manually intervenes with a filter-select state
  // remove the filter to prevent further syncing
  if (activeSelectFilter) {
    dispatch(skemailMailboxReducer.actions.setMultiSelectFilter(undefined));
  }
  if (isSelected) {
    // Filter out threadID from selectedThreadIDs
    dispatch(skemailMailboxReducer.actions.removeSelectedThreadID(threadID));
  } else {
    // Else, add just this thread to the array of selected emails
    dispatch(skemailMailboxReducer.actions.addSelectedThreadID(threadID));
  }
};
