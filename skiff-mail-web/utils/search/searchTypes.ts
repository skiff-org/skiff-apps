import { Icon } from 'nightwatch-ui';
import { IndexedSkemail } from 'skiff-front-search';

import { SearchModifierType } from './searchModifiers';

// The different types of items that will be rendered in each row of the search results body
export enum SearchItemType {
  SKEMAIL_RESULT,
  LABEL_RESULT,
  USER_RESULT,

  QUICK_ACTION,
  HEADER,
  MODIFIERS
}

interface SearchItemBase {
  type: SearchItemType;
}

export interface SkemailSearchResult extends SearchItemBase, IndexedSkemail {
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

// this is for the search results under 'Narrow search'
export interface ModifierSearchResult extends SearchItemBase {
  type: SearchItemType.MODIFIERS;
  modifier: SearchModifierType;
  value: string;
}

// Use this type in functions/components related to search. it's up to the function/component to
// check what the actual type of the returned SearchResult and use it accordingly
export type SearchResult =
  | SkemailSearchResult
  | SearchSectionHeader
  | UserSearchResult
  | LabelSearchResult
  | ModifierSearchResult;

export interface SkemailResultIDs {
  threadID: string;
  emailID: string;
}
