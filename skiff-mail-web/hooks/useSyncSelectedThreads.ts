import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useToast } from 'skiff-front-utils';

import { MailboxFilters } from '../components/mailbox/MailboxActions/MailboxActions';
import { MailboxThreadInfo } from '../models/thread';
import { skemailMailboxReducer } from '../redux/reducers/mailboxReducer';

export const useSyncSelectedThreads = (threads: MailboxThreadInfo[], filter: MailboxFilters | null) => {
  const dispatch = useDispatch();
  const { enqueueToast } = useToast();

  const setSelectedThreadIDs = (selectedThreadIDs: string[]) =>
    dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs }));

  useEffect(() => {
    const selectThreadByFilter = () => {
      let filteredThreads: Array<string>;
      switch (filter) {
        case MailboxFilters.ALL:
          filteredThreads = threads.map((t) => t.threadID);
          break;
        case MailboxFilters.READ:
          filteredThreads = threads.filter((t) => !!t.attributes.read).map((t) => t.threadID);
          break;
        case MailboxFilters.UNREAD:
          filteredThreads = threads.filter((t) => !t.attributes.read).map((t) => t.threadID);

          break;
        case MailboxFilters.ATTACHMENTS:
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
    if (!threads || !filter) return;
    selectThreadByFilter();
  }, [dispatch, filter, threads]);
};
