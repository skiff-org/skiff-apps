import { Icon, IconProps } from 'nightwatch-ui';
import { ThreadFragment, ThreadWithoutContentFragment } from 'skiff-front-graphql';
import {
  WalletAliasWithName,
  abbreviateWalletAddress,
  createEmail,
  splitEmailToAliasAndDomain
} from 'skiff-front-utils';
import { SystemLabels, UserLabel as UserLabelGraphQL, UserLabelVariant } from 'skiff-graphql';
import { isWalletAddress } from 'skiff-utils';

import { MailAppRoutes } from '../constants/route.constants';

export const FOLDER_URL_PARAM = 'folder';
export const ALIAS_LABEL_URL_PARAM = 'alias';

export const RESTRICTED_DRAG_AND_DROP_LABELS = new Set([
  SystemLabels.Sent,
  SystemLabels.Drafts,
  SystemLabels.ScheduleSend,
  SystemLabels.Imports,
  SystemLabels.QuickAliases
]);

export enum LabelType {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  HIDDEN = 'HIDDEN'
}

export enum HiddenLabels {
  Search = 'search'
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

export const NONE_LABEL: NoneLabel = {
  icon: Icon.Remove,
  name: 'None',
  type: LabelType.HIDDEN,
  value: 'None'
};

interface LabelBase {
  name: string;
  value: SystemLabels | HiddenLabels | string;
  type: LabelType;
  dataTest?: string;
}

export interface SystemLabel extends LabelBase {
  type: LabelType.SYSTEM;
  icon: Icon;
}

export interface HiddenLabel extends LabelBase {
  type: LabelType.HIDDEN;
  icon: Icon;
}

interface UserLabelBase extends LabelBase {
  type: LabelType.USER;
  color: IconProps['color'];
  variant: UserLabelVariant;
}

export interface UserLabelPlain extends UserLabelBase {
  variant: UserLabelVariant.Plain;
}

export interface UserLabelFolder extends UserLabelBase {
  variant: UserLabelVariant.Folder;
}

export interface UserLabelAlias extends UserLabelBase {
  variant: UserLabelVariant.Alias;
}

export interface UserLabelImport extends UserLabelBase {
  variant: UserLabelVariant.Import;
}

export interface UserLabelQuickAlias extends UserLabelBase {
  variant: UserLabelVariant.QuickAlias;
}

export interface NoneLabel extends LabelBase {
  type: LabelType.HIDDEN;
  icon: Icon;
}

export type UserLabelTypes = UserLabelPlain | UserLabelFolder | UserLabelAlias | UserLabelImport | UserLabelQuickAlias;

export type Label = SystemLabel | UserLabelTypes | HiddenLabel;

export const isFolder = (label: Label): label is UserLabelFolder =>
  label.type === LabelType.USER && label.variant === UserLabelVariant.Folder;

export const isPlainLabel = (label: Label): label is UserLabelPlain =>
  label.type === LabelType.USER && label.variant === UserLabelVariant.Plain;

export const isAliasLabel = (label: Label): label is UserLabelAlias =>
  label.type === LabelType.USER && label.variant === UserLabelVariant.Alias;

export const isImportLabel = (label: Label): label is UserLabelImport =>
  label.type === LabelType.USER && label.variant === UserLabelVariant.Import;
export const isQuickAliasLabel = (label: Label): label is UserLabelQuickAlias =>
  label.type === LabelType.USER && label.variant === UserLabelVariant.QuickAlias;

export const isSystemLabel = (label: Label): label is SystemLabel => label.type === LabelType.SYSTEM;

export const isNoneLabel = (label: Label): label is HiddenLabel => label.type === LabelType.HIDDEN;

export const userLabelFromGraphQL = (label: UserLabelGraphQL): UserLabelTypes => ({
  type: LabelType.USER,
  color: label.color as IconProps['color'],
  value: label.labelID,
  name: label.labelName,
  variant: label.variant
});

export const userLabelToGraphQL = (label: UserLabelPlain | UserLabelFolder): UserLabelGraphQL => ({
  color: label.color ?? 'red',
  variant: label.variant,
  labelID: label.value,
  labelName: label.name
});

export const sortByName = (labelA: Label, labelB: Label) => labelA.name.localeCompare(labelB.name);

export const splitUserLabelsByVariant = (allLabels: UserLabelTypes[]) => {
  const labels: UserLabelPlain[] = [];
  const folders: UserLabelFolder[] = [];
  const aliasLabels: UserLabelAlias[] = [];
  const importLabels: UserLabelImport[] = [];
  const quickAliasLabels: UserLabelQuickAlias[] = [];

  allLabels.forEach((label) => {
    if (isPlainLabel(label)) {
      labels.push(label);
    } else if (isFolder(label)) {
      folders.push(label);
    } else if (isAliasLabel(label)) {
      aliasLabels.push(label);
    } else if (isImportLabel(label)) {
      importLabels.push(label);
    } else if (isQuickAliasLabel(label)) {
      quickAliasLabels.push(label);
    }
  });

  return {
    labels,
    folders,
    aliasLabels,
    importLabels,
    quickAliasLabels
  };
};

/**
 * If you add a new system label, in order to have the routing work on deployed
 * versions of the app, you must also update webpack.config.base.js and add a new
 * plugin for the system label path.
 *
 * For example:
 * new HtmlWebpackPlugin({
 *    template: path.join(__dirname, '..', 'app.web.html'),
 *    filename: 'drafts.html'
 *  }),
 */
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
    name: 'Imports',
    icon: Icon.MoveMailbox,
    value: SystemLabels.Imports,
    type: LabelType.SYSTEM,
    dataTest: 'imported-mailbox-selector'
  },
  {
    name: 'Quick Aliases',
    icon: Icon.Bolt,
    value: SystemLabels.QuickAliases,
    type: LabelType.SYSTEM
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

export const HIDDEN_LABELS: HiddenLabel[] = [
  {
    name: 'Search',
    value: HiddenLabels.Search,
    icon: Icon.Search,
    type: LabelType.HIDDEN,
    dataTest: 'search-mailbox-selector'
  }
];

const DEFAULT_SIDEBAR_LABELS = [
  SystemLabels.Inbox,
  SystemLabels.Sent,
  SystemLabels.ScheduleSend,
  SystemLabels.Drafts,
  SystemLabels.Spam,
  SystemLabels.Archive,
  SystemLabels.Imports,
  SystemLabels.QuickAliases,
  SystemLabels.Trash
];

export const isDefaultSidebarLabel = (label: SystemLabel) => {
  return (DEFAULT_SIDEBAR_LABELS as string[]).includes(label.value);
};

export const LABEL_TO_SYSTEM_LABEL: { [key in SystemLabels]: SystemLabel } = SYSTEM_LABELS.reduce<{
  [key in SystemLabels]: SystemLabel;
}>((acc, label) => {
  acc[label.value] = label;
  return acc;
}, {} as { [key in SystemLabels]: SystemLabel });

export const LABEL_TO_HIDDEN_LABEL: { [key in SystemLabels]: HiddenLabel } = HIDDEN_LABELS.reduce<{
  [key in SystemLabels]: HiddenLabel;
}>((acc, label) => {
  acc[label.value] = label;
  return acc;
}, {} as { [key in SystemLabels]: HiddenLabel });

export function getHiddenLabelFromPathParams(label: string): string | undefined {
  if (!label) return;

  // if label is not a hidden label, check if it is a valid hidden label
  return Object.values(HiddenLabels).find((systemLabel) => systemLabel.toLowerCase() === label.toLowerCase());
}

export function getSystemLabelFromPathParams(label: string): string | undefined {
  if (!label) {
    return;
  }

  // if label is not a user label, check if it is a valid system label
  return Object.values(SystemLabels).find((systemLabel) => systemLabel.toLowerCase() === label.toLowerCase());
}

export const getUserLabelVariantParam = (variant: UserLabelVariant) => {
  return new URLSearchParams({
    ...(variant === UserLabelVariant.Folder && { [FOLDER_URL_PARAM]: 'true' }),
    ...(variant === UserLabelVariant.Alias && { [ALIAS_LABEL_URL_PARAM]: 'true' })
  });
};

/**
 * generates a path from userLabel and a thread id
 * this is used to navigate to a label mailbox with a thread open
 */
export const getUrlFromUserLabelAndThreadID = (labelName: string, threadId: string, variant: UserLabelVariant) => {
  const params = getUserLabelVariantParam(variant);
  params.append('threadID', threadId);
  const encodedLabelName = encodeURIComponent(labelName.toLowerCase());
  return `${MailAppRoutes.USER_LABEL_MAILBOX}?${params.toString()}#${encodedLabelName}`;
};

/**
 * generates a path to navigate to a system label, user label, or alias label
 */
export const getURLFromLabel = (label: Label) => {
  const encodedLabelName = encodeURIComponent(
    label.type === LabelType.SYSTEM ? label.value.toLowerCase() : label.name.toLowerCase()
  );

  let variantParam = '';
  if (label.type === LabelType.USER) {
    variantParam = getUserLabelVariantParam(label.variant).toString();
  }

  return `${label.type === LabelType.SYSTEM ? MailAppRoutes.HOME : MailAppRoutes.USER_LABEL_MAILBOX}${
    variantParam ? '?' : ''
  }${variantParam}${label.type !== LabelType.SYSTEM ? '#' : ''}${encodedLabelName}`;
};

export const isLabelActive = (label: Label, threadFragments: ThreadWithoutContentFragment[]) => {
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

// Reorder the alias labels list so that the default alias is at the top of the list
export const orderAliasLabels = (aliasLabels: UserLabelAlias[], defaultEmailAlias: string) => {
  const defaultAliasLabel = aliasLabels.find((aliasLabel) => aliasLabel.name === defaultEmailAlias);
  const defaultAliasLabelIndex = defaultAliasLabel ? aliasLabels.indexOf(defaultAliasLabel) : 0;
  if (defaultAliasLabelIndex > 0 && defaultAliasLabel) {
    // Remove the default alias and add it to the front of the array
    aliasLabels.splice(defaultAliasLabelIndex, 1);
    aliasLabels.unshift(defaultAliasLabel);
  }
  return aliasLabels;
};

export const getLabelDisplayName = (
  labelName: string,
  walletAliasesWithName: WalletAliasWithName[],
  abbreviateWallet = true
) => {
  const { alias: aliasLabel, domain } = splitEmailToAliasAndDomain(labelName);
  if (!isWalletAddress(aliasLabel)) return labelName;

  const walletNameAddress =
    walletAliasesWithName.find((walletAliasInfo) => walletAliasInfo.walletAlias === labelName)?.nameAlias ?? '';

  const { alias: walletNameAlias } = splitEmailToAliasAndDomain(walletNameAddress);
  if (walletNameAddress)
    return isWalletAddress(walletNameAlias)
      ? createEmail(abbreviateWalletAddress(walletNameAddress), domain)
      : walletNameAddress;
  return abbreviateWallet ? createEmail(abbreviateWalletAddress(aliasLabel), domain) : labelName;
};
