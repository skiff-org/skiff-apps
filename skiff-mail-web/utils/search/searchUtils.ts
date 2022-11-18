import { SearchItemType, SearchResult, SkemailSearchResult } from './searchTypes';

export function normalizeQuery(searchStr: string): string {
  return searchStr.trim().toLowerCase();
}

// method useful in .filter to get only skemail search results from all search results
export const filterSkemailSearchResults = (result: SearchResult): result is SkemailSearchResult => {
  return result.type === SearchItemType.SKEMAIL_RESULT;
};
