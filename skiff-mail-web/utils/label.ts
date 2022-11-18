import { partition } from 'lodash';
import { Icon, IconProps } from 'nightwatch-ui';
import { SystemLabels, UserLabelVariant } from 'skiff-graphql';
import { UserLabel as UserLabelGraphQL } from 'skiff-graphql';
import { ThreadFragment } from 'skiff-mail-graphql';
import { validate } from 'uuid';

export const RESTRICTED_DRAG_AND_DROP_LABELS = new Set([
  SystemLabels.Sent,
  SystemLabels.Drafts,
  SystemLabels.ScheduleSend
]);

export enum LabelType {
  SYSTEM = 'SYSTEM',
  USER = 'USER'
}

export enum ModifyLabelsActions {
  APPLY = 'applyLabels',
  REMOVE = 'removeLabels'
}

export const FILES_LABEL: SystemLabel = {
  icon: Icon.Image,
  name: 'Files',
  type: LabelType.SYSTEM,
  value: 'FILES'
};

interface LabelBase {
  name: string;
  value: SystemLabels | string;
  type: LabelType;
  dataTest?: string;
}

export interface SystemLabel extends LabelBase {
  type: LabelType.SYSTEM;
  icon: Icon;
}

interface UserLabelBase extends LabelBase {
  type: LabelType.USER;
  color: IconProps['color'];
  variant: UserLabelVariant;
}

export interface UserLabel extends UserLabelBase {
  variant: UserLabelVariant.Plain;
}

export interface UserLabelFolder extends UserLabelBase {
  variant: UserLabelVariant.Folder;
}

export type Label = SystemLabel | UserLabel | UserLabelFolder;

export const isFolder = (label: Label): label is UserLabelFolder =>
  label.type === LabelType.USER && label.variant === UserLabelVariant.Folder;

export const isUserLabel = (label: Label): label is UserLabel =>
  label.type === LabelType.USER && label.variant === UserLabelVariant.Plain;

export const isSystemLabel = (label: Label): label is SystemLabel => label.type === LabelType.SYSTEM;

export const userLabelFromGraphQL = (label: UserLabelGraphQL): UserLabel | UserLabelFolder => ({
  type: LabelType.USER,
  color: label.color as IconProps['color'],
  value: label.labelID,
  name: label.labelName,
  variant: label.variant
});

export const userLabelToGraphQL = (label: UserLabel | UserLabelFolder): UserLabelGraphQL => ({
  color: label.color ?? 'red',
  variant: label.variant,
  labelID: label.value,
  labelName: label.name
});

export const sortByName = (labelA: Label, labelB: Label) => labelA.name.localeCompare(labelB.name);

export const splitUserLabelsAndFolders = (labels: (UserLabel | UserLabelFolder)[]) => partition(labels, isUserLabel);

export const SYSTEM_LABELS: SystemLabel[] = [
  {
    name: 'Inbox',
    icon: Icon.Inbox,
    value: SystemLabels.Inbox,
    type: LabelType.SYSTEM,
    dataTest: 'inbox-mailbox-selector'
  },
  {
    name: 'Sent',
    icon: Icon.Send,
    value: SystemLabels.Sent,
    type: LabelType.SYSTEM,
    dataTest: 'sent-mailbox-selector'
  },
  {
    name: 'Send later',
    icon: Icon.Calendar,
    value: SystemLabels.ScheduleSend,
    type: LabelType.SYSTEM,
    dataTest: 'send-later-mailbox-selector'
  },
  {
    name: 'Drafts',
    icon: Icon.FileEmpty,
    value: SystemLabels.Drafts,
    type: LabelType.SYSTEM,
    dataTest: 'draft-mailbox-selector'
  },
  {
    name: 'Spam',
    icon: Icon.Spam,
    value: SystemLabels.Spam,
    type: LabelType.SYSTEM,
    dataTest: 'spam-mailbox-selector'
  },
  {
    name: 'Archive',
    icon: Icon.Archive,
    value: SystemLabels.Archive,
    type: LabelType.SYSTEM,
    dataTest: 'archive-mailbox-selector'
  },
  {
    name: 'Trash',
    icon: Icon.Trash,
    value: SystemLabels.Trash,
    type: LabelType.SYSTEM,
    dataTest: 'trash-mailbox-selector'
  }
];

const DEFAULT_SIDEBAR_LABELS = [SystemLabels.Inbox, SystemLabels.Sent, SystemLabels.ScheduleSend, SystemLabels.Drafts];

export const isDefaultSidebarLabel = (label: SystemLabel) => {
  return (DEFAULT_SIDEBAR_LABELS as string[]).includes(label.value);
};

export const LABEL_TO_SYSTEM_LABEL: { [key: string]: SystemLabel } = SYSTEM_LABELS.reduce((acc, label) => {
  acc[label.value] = label;
  return acc;
}, {});

export function getLabelFromPathParams(label: string): string | undefined {
  if (!label) {
    return;
  }

  // check if label is a user label
  if (validate(label)) {
    return label;
  }

  // if label is not a user label, check if it is a valid system label
  return Object.values(SystemLabels).find((systemLabel) => systemLabel.toLowerCase() === label.toLowerCase());
}

/**
 * generates a path from userLabel and a thread id
 * this is used to navigate to a label mailbox with a thread open
 */
export const getUrlFromUserLabelAndThreadID = (userLabel: string, threadId: string) =>
  `/label?threadID=${threadId}#${userLabel}`;

export const isLabelActive = (label: Label, threadFragments: ThreadFragment[]) => {
  // Label is active if every selected thread already has it applied
  const active =
    !!threadFragments.length &&
    threadFragments.every(
      (thread) =>
        thread?.attributes.userLabels.some(({ labelID }) => labelID === label.value) ||
        thread?.attributes.systemLabels.some((value) => value === label.value)
    );

  return active;
};

export const isThreadInFolder = (threadFragment: ThreadFragment) =>
  threadFragment.attributes.userLabels.some((label) => label.variant === UserLabelVariant.Folder);

export const getActiveSystemLabel = (systemLabels: string[]) => {
  if (!systemLabels.length) return undefined;
  // if Archive or Trash return those
  if (systemLabels.includes(SystemLabels.Archive)) {
    return SystemLabels.Archive;
  }

  if (systemLabels.includes(SystemLabels.Trash)) {
    return SystemLabels.Trash;
  }

  // if the thread is both in Sent and at least one other system label, return the other label
  if (systemLabels.length > 1 && systemLabels.includes(SystemLabels.Sent)) {
    return systemLabels.find((label) => label != SystemLabels.Sent);
  }

  // otherwise return the first one
  return systemLabels[0];
};
