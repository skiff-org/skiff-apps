import { MailboxView } from '../components/mailbox/Mailbox.types';
import { MailboxThreadInfo } from '../models/thread';

export const threadFilter = (thread: MailboxThreadInfo, viewMode: MailboxView) => {
  switch (viewMode) {
    case MailboxView.ALL:
      return true;
    case MailboxView.UNREAD:
      return !thread.attributes.read;
    case MailboxView.READ:
      return thread.attributes.read;
    default:
      return true;
  }
};

export const threadSearchFilter = (thread: MailboxThreadInfo, query: string) => {
  // Thread Labels
  for (const label of thread.attributes.userLabels) {
    if (label.labelName.toLowerCase().includes(query)) {
      return true;
    }
  }
  for (const email of thread.emails) {
    if (
      email.from.address.toLowerCase().includes(query) ||
      email.from.name?.toLowerCase().includes(query) ||
      email.decryptedText?.toLowerCase().includes(query) ||
      email.decryptedSubject?.toLowerCase().includes(query)
    ) {
      return true;
    }
    // Check to address
    for (const to of email.to) {
      if (to.address.toLowerCase().includes(query) || to.name?.toLowerCase().includes(query)) {
        return true;
      }
    }
  }
};
