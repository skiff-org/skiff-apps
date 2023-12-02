import { ThreadFragment, ThreadWithoutContentFragment } from 'skiff-front-graphql';

import { MailboxEmailInfo, ThreadViewEmailInfo } from './email';

type MailboxThreadFragment = Omit<ThreadFragment, 'threadContentUpdatedAt'>;

// Subset of ThreadFragment fields that are needed to render MessageCells and MessageDetails.
export type MailboxThreadInfo = Omit<ThreadWithoutContentFragment, 'emails'> & {
  emails: Array<MailboxEmailInfo>;
  // used to track associated thread for drafts
  replyThread?: MailboxThreadFragment;
};
export type ThreadDetailInfo = Omit<MailboxThreadFragment, 'emails'> & { emails: Array<ThreadViewEmailInfo> };
