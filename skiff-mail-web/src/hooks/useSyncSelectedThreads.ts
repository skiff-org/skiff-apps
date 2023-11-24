import differenceBy from 'lodash/differenceBy';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useToast, usePrevious } from 'skiff-front-utils';

import { MailboxThreadInfo } from '../models/thread';
import { skemailMailboxReducer } from '../redux/reducers/mailboxReducer';
import { MailboxMultiSelectFilter } from '../utils/mailboxActionUtils';

export const useSyncSelectedThreads = (threads: MailboxThreadInfo[], filter?: MailboxMultiSelectFilter) => {
  const dispatch = useDispatch();
  const { enqueueToast } = useToast();
  const prevThreads: MailboxThreadInfo[] | undefined = usePrevious(threads);
  const threadsChanged = !!prevThreads ? !!differenceBy(threads, prevThreads, 'threadID').length : !!threads.length;

  const prevFilter = usePrevious(filter);
  const filterChanged = filter !== prevFilter;
  // only attempt resync if either threads or filter changed
  const shouldResync = filterChanged || threadsChanged;

  useEffect(() => {
    const setSelectedThreadIDs = (selectedThreadIDs: string[]) =>
      dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs }));
    const selectThreadByFilter = () => {
      let filteredThreads: Array<string>;
      switch (filter) {
        case MailboxMultiSelectFilter.ALL:
          filteredThreads = threads.map((t) => t.threadID);
          break;
        case MailboxMultiSelectFilter.READ:
          filteredThreads = threads.filter((t) => !!t.attributes.read).map((t) => t.threadID);
          break;
        case MailboxMultiSelectFilter.UNREAD:
          filteredThreads = threads.filter((t) => !t.attributes.read).map((t) => t.threadID);

          break;
        case MailboxMultiSelectFilter.ATTACHMENTS:
          filteredThreads = threads
            .filter((t) => t.emails[t.emails.length - 1]?.decryptedAttachmentMetadata?.length)
            .map((t) => t.threadID);
          break;
        default:
          filteredThreads = [];
          break;
      }
      setSelectedThreadIDs(filteredThreads);
      if (filteredThreads.length === 0 && !!filter) {
        enqueueToast({
          title: 'No messages selected',
          body: 'Nothing matches the selected filter.'
        });
      }
    };
    if (!threads.length || !filter || !shouldResync) return;
    selectThreadByFilter();
  }, [dispatch, filter, threads, shouldResync, enqueueToast]);
};
