import { Icon } from 'nightwatch-ui';
import { SkemailMiniSearchResult, DateRangeFilter } from 'skiff-front-search';
import { AddressObject, SystemLabels } from 'skiff-graphql';

import { ThreadDetailInfo } from '../../models/thread';
import { UserLabelPlain, UserLabelFolder } from '../label';

// The different types of items that will be rendered in each row of the search results body
export enum SearchItemType {
  SKEMAIL_RESULT,
  LABEL_RESULT,
  USER_RESULT,
  QUICK_ACTION,
  HEADER
}

// 'DRAFTS' and 'VIRUS' are excluded; 'DRAFTS' not currently indexed.
// ordering is the same as sidebar
const filterableLabels = {
  Inbox: SystemLabels.Inbox,
  Sent: SystemLabels.Sent,
  ScheduleSend: SystemLabels.ScheduleSend,
  Imports: SystemLabels.Imports,
  Spam: SystemLabels.Spam,
  Archive: SystemLabels.Archive,
  Trash: SystemLabels.Trash,
  QuickAliases: SystemLabels.QuickAliases
} as const;

export type FilterableSystemLabel = (typeof filterableLabels)[keyof typeof filterableLabels];

export const FILTERABLE_SYSTEM_LABELS: FilterableSystemLabel[] = Object.values(filterableLabels);

export enum MailboxSearchFilterType {
  FROM = 'FROM',
  TO = 'TO',
  SUBJECT = 'SUBJECT',
  BODY = 'BODY',
  DATE = 'DATE',
  SYSTEM_LABEL = 'SYSTEM_LABEL',
  USER_FOLDER_LABEL = 'USER_FOLDER_LABEL',
  USER_PLAIN_LABEL = 'USER_PLAIN_LABEL'
}

// filters that narrow the fields within which we search a query string, in contrast to those that filter on metadata such as dates or labels
export type FieldNarrowingSearchFilter =
  | MailboxSearchFilterType.BODY
  | MailboxSearchFilterType.SUBJECT
  | MailboxSearchFilterType.FROM
  | MailboxSearchFilterType.TO;

export type EditableMailboxSearchFilterType =
  | MailboxSearchFilterType.FROM
  | MailboxSearchFilterType.TO
  | MailboxSearchFilterType.DATE
  | MailboxSearchFilterType.SYSTEM_LABEL
  | MailboxSearchFilterType.USER_PLAIN_LABEL
  | MailboxSearchFilterType.USER_FOLDER_LABEL;

export const EDITABLE_FILTER_TYPES: EditableMailboxSearchFilterType[] = [
  MailboxSearchFilterType.FROM,
  MailboxSearchFilterType.TO,
  MailboxSearchFilterType.DATE,
  MailboxSearchFilterType.SYSTEM_LABEL,
  MailboxSearchFilterType.USER_PLAIN_LABEL,
  MailboxSearchFilterType.USER_FOLDER_LABEL
];

type FiniteSelectionSearchFilterType =
  | MailboxSearchFilterType.DATE
  | MailboxSearchFilterType.SYSTEM_LABEL
  | MailboxSearchFilterType.USER_FOLDER_LABEL
  | MailboxSearchFilterType.USER_PLAIN_LABEL;

export const FINITE_SELECTION_FILTER_TYPES: FiniteSelectionSearchFilterType[] = [
  MailboxSearchFilterType.DATE,
  MailboxSearchFilterType.SYSTEM_LABEL,
  MailboxSearchFilterType.USER_FOLDER_LABEL,
  MailboxSearchFilterType.USER_PLAIN_LABEL
];

export type MetadataFilterType =
  | MailboxSearchFilterType.DATE
  | MailboxSearchFilterType.SYSTEM_LABEL
  | MailboxSearchFilterType.USER_PLAIN_LABEL
  | MailboxSearchFilterType.USER_FOLDER_LABEL;

export const METADATA_FILTER_TYPES: MetadataFilterType[] = [
  MailboxSearchFilterType.DATE,
  MailboxSearchFilterType.SYSTEM_LABEL,
  MailboxSearchFilterType.USER_PLAIN_LABEL,
  MailboxSearchFilterType.USER_FOLDER_LABEL
];

interface MailboxSearchFilterBase {
  type: MailboxSearchFilterType;
}

export interface AddressSearchFilter extends MailboxSearchFilterBase {
  type: MailboxSearchFilterType.FROM | MailboxSearchFilterType.TO;
  addressObj: AddressObject;
}

export interface DateRangeSearchFilter extends MailboxSearchFilterBase {
  type: MailboxSearchFilterType.DATE;
  range: DateRangeFilter;
}

export interface EmailContentSearchFilter extends MailboxSearchFilterBase {
  type: MailboxSearchFilterType.SUBJECT | MailboxSearchFilterType.BODY;
}

export interface SystemLabelSearchFilter extends MailboxSearchFilterBase {
  type: MailboxSearchFilterType.SYSTEM_LABEL;
  systemLabel: FilterableSystemLabel;
}

export interface UserPlainLabelSearchFilter extends MailboxSearchFilterBase {
  type: MailboxSearchFilterType.USER_PLAIN_LABEL;
  userLabel: UserLabelPlain;
}

export interface UserFolderSearchFilter extends MailboxSearchFilterBase {
  type: MailboxSearchFilterType.USER_FOLDER_LABEL;
  userLabel: UserLabelFolder;
}

export type MailboxSearchFilter =
  | AddressSearchFilter
  | EmailContentSearchFilter
  | DateRangeSearchFilter
  | SystemLabelSearchFilter
  | UserPlainLabelSearchFilter
  | UserFolderSearchFilter;

type MailboxSearchFilterChipValue =
  | DateRangeFilter
  | AddressObject
  | MailboxSearchFilterType.SUBJECT
  | MailboxSearchFilterType.BODY
  | FilterableSystemLabel
  | UserLabelPlain
  | UserLabelFolder;

interface MailboxSearchFilterChipBase {
  type: MailboxSearchFilterType;
  label: string;
  value?: MailboxSearchFilterChipValue;
}

interface EditableSearchFilterChipBase extends MailboxSearchFilterChipBase {
  type: EditableMailboxSearchFilterType;
  value?: AddressObject | DateRangeFilter | FilterableSystemLabel | UserLabelPlain | UserLabelFolder;
}

export interface EditableDateRangeSearchFilterChip extends EditableSearchFilterChipBase {
  type: MailboxSearchFilterType.DATE;
  value?: DateRangeFilter;
}

export interface EditableAddressSearchFilterChip extends EditableSearchFilterChipBase {
  type: MailboxSearchFilterType.FROM | MailboxSearchFilterType.TO;
  value?: AddressObject;
}

export interface EditableSystemLabelFilterChip extends EditableSearchFilterChipBase {
  type: MailboxSearchFilterType.SYSTEM_LABEL;
  value?: FilterableSystemLabel;
}

export interface EditableUserPlainLabelFilterChip extends EditableSearchFilterChipBase {
  type: MailboxSearchFilterType.USER_PLAIN_LABEL;
  value?: UserLabelPlain;
}

export interface EditableUserFolderFilterChip extends EditableSearchFilterChipBase {
  type: MailboxSearchFilterType.USER_FOLDER_LABEL;
  value?: UserLabelFolder;
}

export type EditableMailboxSearchFilterChip =
  | EditableAddressSearchFilterChip
  | EditableDateRangeSearchFilterChip
  | EditableSystemLabelFilterChip
  | EditableUserPlainLabelFilterChip
  | EditableUserFolderFilterChip;

// editable filter chips for which there is a fixed range of options at a given time, e.g. system or user labels,
// versus, e.g., a from address that allows free text entry
export type FiniteSelectionFilterChip =
  | EditableDateRangeSearchFilterChip
  | EditableSystemLabelFilterChip
  | EditableUserPlainLabelFilterChip
  | EditableUserFolderFilterChip;

interface PopulatedMailboxSearchFilterChipBase extends MailboxSearchFilterChipBase {
  value: MailboxSearchFilterChipValue;
}

interface AddressSearchFilterChip extends PopulatedMailboxSearchFilterChipBase {
  type: MailboxSearchFilterType.TO | MailboxSearchFilterType.FROM;
  value: AddressObject;
}

interface ContentFieldSearchFilterChip extends PopulatedMailboxSearchFilterChipBase {
  type: MailboxSearchFilterType.SUBJECT | MailboxSearchFilterType.BODY;
  value: MailboxSearchFilterType.SUBJECT | MailboxSearchFilterType.BODY;
}

interface DateRangeSearchFilterChip extends PopulatedMailboxSearchFilterChipBase {
  type: MailboxSearchFilterType.DATE;
  value: DateRangeFilter;
}

interface SystemLabelSearchFilterChip extends PopulatedMailboxSearchFilterChipBase {
  type: MailboxSearchFilterType.SYSTEM_LABEL;
  value: FilterableSystemLabel;
}

interface UserPlainLabelSearchFilterChip extends PopulatedMailboxSearchFilterChipBase {
  type: MailboxSearchFilterType.USER_PLAIN_LABEL;
  value: UserLabelPlain;
}

interface UserFolderSearchFilterChip extends PopulatedMailboxSearchFilterChipBase {
  type: MailboxSearchFilterType.USER_FOLDER_LABEL;
  value: UserLabelFolder;
}

export type PopulatedMailboxSearchFilterChip =
  | AddressSearchFilterChip
  | ContentFieldSearchFilterChip
  | DateRangeSearchFilterChip
  | SystemLabelSearchFilterChip
  | UserPlainLabelSearchFilterChip
  | UserFolderSearchFilterChip;

export type MailboxSearchFilterChip = PopulatedMailboxSearchFilterChip | EditableMailboxSearchFilterChip;

interface SearchItemBase {
  type: SearchItemType;
}

export interface SkemailSearchResultBase extends SearchItemBase {
  type: SearchItemType.SKEMAIL_RESULT;
}

export interface SearchSectionHeader extends SearchItemBase {
  type: SearchItemType.HEADER;
  label: string;
}

export interface UserSearchResult extends SearchItemBase {
  type: SearchItemType.USER_RESULT;
  email: string;
  displayName?: string;
}

export interface LabelSearchResult extends SearchItemBase {
  type: SearchItemType.LABEL_RESULT;
  title: string;
  icon: Icon;
  color?: string;
}

export type SkemailResultInfo = Pick<SkemailMiniSearchResult, 'threadID' | 'match'> & { emailID: string };

export type SkemailSearchResult = SkemailResultInfo & SkemailSearchResultBase;

// Use this type in functions/components related to search. it's up to the function/component to
// check what the actual type of the returned SearchResult and use it accordingly
export type SearchResult = SkemailSearchResult | SearchSectionHeader | UserSearchResult | LabelSearchResult;

export type SkemailResultIDs = Omit<SkemailResultInfo, 'match'>;

export type MatchInfo = SkemailResultInfo['match'];

// note we use ThreadDetailInfo rather than MailboxThreadInfo for search result message cells,
// because we sometimes need to examine unabbreviated email text to excerpt a query match
export type SkemailResultThreadInfo = Pick<SkemailResultInfo, 'emailID' | 'match'> & { thread: ThreadDetailInfo };
