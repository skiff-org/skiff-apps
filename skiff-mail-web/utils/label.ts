import { Icon, IconProps } from '@skiff-org/skiff-ui';
import { validate } from 'uuid';

import { SystemLabels, UserLabel as UserLabelGraphQL } from '../generated/graphql';

export const RESTRICTED_DRAG_AND_DROP_LABELS = new Set([SystemLabels.Sent, SystemLabels.Drafts]);

export enum LabelType {
  SYSTEM = 'SYSTEM',
  USER = 'USER'
}

interface LabelBase {
  name: string;
  value: string;
  type: LabelType;
}

export interface SystemLabel extends LabelBase {
  type: LabelType.SYSTEM;
  icon: Icon;
}

export interface UserLabel extends LabelBase {
  type: LabelType.USER;
  color: IconProps['color'];
}

export type Label = SystemLabel | UserLabel;

export const userLabelFromGraphQL = (label: UserLabelGraphQL): UserLabel => ({
  type: LabelType.USER,
  color: label.color as IconProps['color'],
  value: label.labelID,
  name: label.labelName
});

export const SYSTEM_LABELS: SystemLabel[] = [
  {
    name: 'Inbox',
    icon: Icon.Inbox,
    value: SystemLabels.Inbox,
    type: LabelType.SYSTEM
  },
  {
    name: 'Sent',
    icon: Icon.Send,
    value: SystemLabels.Sent,
    type: LabelType.SYSTEM
  },
  {
    name: 'Drafts',
    icon: Icon.File,
    value: SystemLabels.Drafts,
    type: LabelType.SYSTEM
  },
  {
    name: 'Spam',
    icon: Icon.Spam,
    value: SystemLabels.Spam,
    type: LabelType.SYSTEM
  },
  {
    name: 'Trash',
    icon: Icon.Trash,
    value: SystemLabels.Trash,
    type: LabelType.SYSTEM
  }
];

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
