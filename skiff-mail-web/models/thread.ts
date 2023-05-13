import { ThreadFragment, ThreadWithoutContentFragment } from 'skiff-front-graphql';

import { MailboxEmailInfo, ThreadViewEmailInfo } from './email';

// Subset of ThreadFragment fields that are needed to render MessageCells and MessageDetails.
export type MailboxThreadInfo = Omit<ThreadWithoutContentFragment, 'emails'> & { emails: Array<MailboxEmailInfo> };
export type ThreadDetailInfo = Omit<ThreadFragment, 'emails'> & { emails: Array<ThreadViewEmailInfo> };
