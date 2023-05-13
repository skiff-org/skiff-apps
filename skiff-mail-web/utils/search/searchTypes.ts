import { Icon } from 'nightwatch-ui';

// The different types of items that will be rendered in each row of the search results body
export enum SearchItemType {
  SKEMAIL_RESULT,
  LABEL_RESULT,
  USER_RESULT,
  QUICK_ACTION,
  HEADER
}

interface SearchItemBase {
  type: SearchItemType;
}

export interface SkemailSearchResult extends SearchItemBase {
  type: SearchItemType.SKEMAIL_RESULT;
  id: string;
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

// Use this type in functions/components related to search. it's up to the function/component to
// check what the actual type of the returned SearchResult and use it accordingly
export type SearchResult = SkemailSearchResult | SearchSectionHeader | UserSearchResult | LabelSearchResult;

export interface SkemailResultIDs {
  threadID: string;
  emailID: string;
}
