import { ThreadFragment } from '../generated/graphql';
import { MailboxEmailInfo } from './email';

// Subset of ThreadFragment fields that are needed to render MessageCells and MessageDetails.
export type MailboxThreadInfo = Omit<ThreadFragment, 'emails'> & { emails: Array<MailboxEmailInfo> };
