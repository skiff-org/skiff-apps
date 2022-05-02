import { EmailFragment } from '../generated/graphql';

// Subset of EmailFragment fields that are needed to render MessageCells and ThreadBlock rows in frontend.
// Excludes encrypted contents which are irrelevant to the frontend and cannot be set by drafts.
export type MailboxEmailInfo = Pick<
  EmailFragment,
  | 'id'
  | 'createdAt'
  | 'from'
  | 'to'
  | 'cc'
  | 'bcc'
  | 'decryptedSubject'
  | 'decryptedText'
  | 'decryptedHtml'
  | 'decryptedTextAsHtml'
  | 'decryptedAttachmentMetadata'
>;
