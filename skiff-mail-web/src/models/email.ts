import { EmailFragment, EmailWithoutContentFragment } from 'skiff-front-graphql';

// Subset of EmailFragment fields that are needed to render MessageCells and ThreadBlock rows in frontend.
// Excludes encrypted contents which are irrelevant to the frontend and can't be set by drafts.
// NOTE: When requesting the mailbox query, the backend may return a shorter decryptedText containing a preview snippet, as opposed to the full decryptedText.
export type MailboxEmailInfo = Pick<
  EmailWithoutContentFragment,
  | 'id'
  | 'createdAt'
  | 'from'
  | 'to'
  | 'cc'
  | 'bcc'
  | 'replyTo'
  | 'decryptedSubject'
  | 'decryptedTextSnippet'
  | 'decryptedAttachmentMetadata'
  | 'encryptedRawMimeUrl'
  | 'decryptedSessionKey'
  | 'scheduleSendAt'
  | 'notificationsTurnedOffForSender'
>;

// Extends MailboxEmailInfo with fields that are needed to render the full email in the ThreadView.
export type ThreadViewEmailInfo = MailboxEmailInfo &
  Pick<EmailFragment, 'decryptedText' | 'decryptedHtml' | 'decryptedTextAsHtml'>;
