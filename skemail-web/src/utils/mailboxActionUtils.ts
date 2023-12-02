import { SystemLabels, BulkActionVariant } from 'skiff-graphql';
import { upperCaseFirstLetter } from 'skiff-utils';

import { UserLabelFolder, UserLabelPlain, Label, isSystemLabel } from './label';

// strings used rather than numbers
// so that all are truthy
export enum BulkAction {
  MOVE_FOLDER = 'MOVE_FOLDER',
  APPLY_LABEL = 'APPLY_LABEL',
  REMOVE_LABEL = 'REMOVE_LABEL',
  TRASH = 'TRASH',
  ARCHIVE = 'ARCHIVE',
  TOGGLE_READ = 'TOGGLE_READ',
  MOVE_TO_INBOX = 'MOVE_TO_INBOX',
  PERMANENTLY_DELETE = 'PERMANENTLY_DELETE'
}

// bulk actions that are completed async via a job
type AsyncBulkAction = Exclude<BulkAction, BulkAction.TOGGLE_READ>;

export enum MailboxMultiSelectFilter {
  ALL = 'All',
  READ = 'Read',
  UNREAD = 'Unread',
  ATTACHMENTS = 'Has file'
}

export const getBulkActionVariant = (bulkAction: AsyncBulkAction) =>
  bulkAction === BulkAction.PERMANENTLY_DELETE ? BulkActionVariant.PermanentlyDelete : BulkActionVariant.ModifyLabels;

// these bulk actions involve moving a thread to a new label, to the exclusion of the original;
// e.g. moving from one folder to another or from archive to trash;
// REMOVE_LABEL also fits in this category, since a label is 'excluded from itself' by its removal;
// PERMANENTLY_DELETE, while not a label modification also fits, given that permanently deleted threads are excluded from "TRASH"
const MUTEX_BULK_ACTIONS = [
  BulkAction.MOVE_FOLDER,
  BulkAction.TRASH,
  BulkAction.ARCHIVE,
  BulkAction.MOVE_TO_INBOX,
  BulkAction.REMOVE_LABEL,
  BulkAction.PERMANENTLY_DELETE
];
export const isMutexBulkAction = (bulkAction: BulkAction) => MUTEX_BULK_ACTIONS.includes(bulkAction);

type UserPlainLabelBulkAction = BulkAction.APPLY_LABEL | BulkAction.REMOVE_LABEL;
type UserFolderBulkAction = BulkAction.MOVE_FOLDER;
type SystemLabelBulkAction = BulkAction.ARCHIVE | BulkAction.TRASH | BulkAction.MOVE_TO_INBOX;
type ReadUnreadBulkAction = BulkAction.TOGGLE_READ;
type PermDeleteBulkAction = BulkAction.PERMANENTLY_DELETE;

interface BulkActionInfoBase {
  type: BulkAction;
  // the mailbox in which the bulk action was executed
  // SystemLabel or labelID
  originLabelValue: string;
}

interface UserFolderBulkActionInfo extends BulkActionInfoBase {
  type: UserFolderBulkAction;
  destinationFolder: UserLabelFolder;
}

interface UserPlainLabelBulkActionInfo extends BulkActionInfoBase {
  type: UserPlainLabelBulkAction;
  labeToApplyOrRemove: UserLabelPlain;
}

interface SystemLabelBulkActionInfo extends BulkActionInfoBase {
  type: SystemLabelBulkAction;
}

interface PermDeleteBulkActionInfo extends BulkActionInfoBase {
  type: PermDeleteBulkAction;
}

interface ToggleReadBulkActionInfo extends BulkActionInfoBase {
  type: ReadUnreadBulkAction;
  resultingReadState: boolean;
}

// bulk actions that are completed asynchronously
type AsyncBulkActionInfo =
  | UserPlainLabelBulkActionInfo
  | UserFolderBulkActionInfo
  | SystemLabelBulkActionInfo
  | PermDeleteBulkActionInfo;

export type MailboxActionInfo = AsyncBulkActionInfo | ToggleReadBulkActionInfo;

export interface InProgressBulkAction {
  bulkJobID: string;
  bulkAction: AsyncBulkActionInfo;
  // we may keep action around briefly upon completion to control UI
  isFinishing?: boolean;
}

//copy utils
export const getCurrentMailboxName = (label: Label) => {
  if (!label) {
    return '';
  }
  if (label.value === SystemLabels.Inbox) {
    return label.name;
  }
  return `${isSystemLabel(label) ? label.name : `'${label.name}' mailbox`}`;
};

export const getAction = (mailboxAction: BulkAction, past?: boolean) => {
  switch (mailboxAction) {
    case BulkAction.APPLY_LABEL:
      return past ? 'labeled' : 'label';
    case BulkAction.REMOVE_LABEL:
      return past ? 'removed' : 'remove';
    case BulkAction.ARCHIVE:
      return past ? 'archived' : 'archive';
    case BulkAction.TOGGLE_READ:
      return past ? 'marked' : 'mark';
    case BulkAction.MOVE_FOLDER:
    case BulkAction.TRASH:
    case BulkAction.MOVE_TO_INBOX:
      return past ? 'moved' : 'move';
    case BulkAction.PERMANENTLY_DELETE:
      return past ? 'deleted' : 'delete';
  }
};

export const getActionTarget = (mailboxActionInfo: MailboxActionInfo) => {
  switch (mailboxActionInfo.type) {
    case BulkAction.APPLY_LABEL:
      return ` as '${mailboxActionInfo.labeToApplyOrRemove.name}'`;
    case BulkAction.MOVE_FOLDER:
      return ` to '${mailboxActionInfo.destinationFolder.name}'`;
    case BulkAction.TRASH:
      return ' to Trash';
    case BulkAction.TOGGLE_READ:
      return ` as ${mailboxActionInfo.resultingReadState ? 'read' : 'unread'}`;
    case BulkAction.MOVE_TO_INBOX:
      return ' to Inbox';
    case BulkAction.REMOVE_LABEL:
    case BulkAction.ARCHIVE:
    case BulkAction.PERMANENTLY_DELETE:
      return '';
  }
};

export const getSuccessMessage = (mailboxAction: BulkAction, bulk?: boolean) =>
  `${upperCaseFirstLetter(getAction(mailboxAction, true))}${bulk ? ' all' : ''}${
    mailboxAction === BulkAction.REMOVE_LABEL ? ' labels' : ' emails'
  }`;

export const getMailboxActionProgressDescription = (mailboxActionInfo: AsyncBulkActionInfo) => {
  switch (mailboxActionInfo.type) {
    case BulkAction.APPLY_LABEL:
      return 'Labeling all emails';
    case BulkAction.MOVE_FOLDER:
      return 'Moving all emails';
    case BulkAction.ARCHIVE:
      return 'Archiving all emails';
    case BulkAction.MOVE_TO_INBOX:
      return 'Moving all emails to Inbox';
    case BulkAction.REMOVE_LABEL:
      return 'Removing labels from all emails';
    case BulkAction.TRASH:
      return 'Moving all emails to Trash';
    case BulkAction.PERMANENTLY_DELETE:
      return 'Emptying Trash';
  }
};
