import noop from 'lodash/noop';
import { SetStateAction, createContext, useState } from 'react';

import { MailboxSearchFilter, SearchResult } from './searchTypes';

// Search categories are used to represent the different types that can show up in search
// results. For example, the `USER` search result will contain profile picture, email, address ...etc
// while the `SKEMAIL` search result will have subject, content ...etc.
export enum SearchCategory {
  SKEMAIL,
  LABEL,
  USER,
  ATTACHMENT
}

export enum SearchSortOrder {
  Relevance,
  Asc,
  Desc
}

interface SearchContextProps {
  category: SearchCategory;
  mailboxQuery: string;
  // we maintain separate query state for cmd palette and mailbox search, since they can be active simultaneously when
  // cmd palette is in foreground
  cmdPaletteQuery: string;
  searchResults: SearchResult[] | undefined;
  isSearchInProgress: boolean;
  searchFilters: MailboxSearchFilter[];
  setMailboxQuery: (query: SetStateAction<string>) => void;
  setCmdPaletteQuery: (query: SetStateAction<string>) => void;
  setLastSubmittedMailboxQuery: (query: SetStateAction<string | undefined>) => void;
  setSearchResults: (results: SetStateAction<SearchResult[]>) => void;
  setCategory: (category: SetStateAction<SearchCategory>) => void;
  setSearchFilters: (filters: SetStateAction<MailboxSearchFilter[]>) => void;
  setIsSearchInProgress: (isSearchInProgress: SetStateAction<boolean>) => void;
  setLastSubmittedSearchFilters: (filters: SetStateAction<MailboxSearchFilter[] | undefined>) => void;
  searchSortOrder: SearchSortOrder;
  setSearchSortOrder: (sortOrder: SetStateAction<SearchSortOrder>) => void;
  lastSubmittedMailboxQuery?: string;
  lastSubmittedSearchFilters?: MailboxSearchFilter[];
}

export interface SearchConfig {
  defaultCategory?: SearchCategory;
}

export const SearchContext = createContext<SearchContextProps>({
  category: SearchCategory.SKEMAIL,
  mailboxQuery: '',
  cmdPaletteQuery: '',
  searchResults: undefined,
  isSearchInProgress: false,
  searchFilters: [],
  searchSortOrder: SearchSortOrder.Relevance,
  setMailboxQuery: noop,
  setCmdPaletteQuery: noop,
  setLastSubmittedMailboxQuery: noop,
  setSearchResults: noop,
  setCategory: noop,
  setIsSearchInProgress: noop,
  setSearchFilters: noop,
  setSearchSortOrder: noop,
  setLastSubmittedSearchFilters: noop
});

// Components that need access to the search provider should be wrapped in the SearchProvider;
// favor useSearch.ts as an intermediary to this provider rather than using it directly
export const SearchProvider = ({ children, config }: { children?: React.ReactNode; config?: SearchConfig }) => {
  const [category, setCategory] = useState<SearchCategory>(config?.defaultCategory ?? SearchCategory.SKEMAIL);
  const [mailboxQuery, setMailboxQuery] = useState('');
  const [cmdPaletteQuery, setCmdPaletteQuery] = useState('');
  const [lastSubmittedMailboxQuery, setLastSubmittedMailboxQuery] = useState<string | undefined>(undefined);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchInProgress, setIsSearchInProgress] = useState(false);
  const [searchFilters, setSearchFilters] = useState<MailboxSearchFilter[]>([]);
  const [searchSortOrder, setSearchSortOrder] = useState<SearchSortOrder>(SearchSortOrder.Relevance);
  const [lastSubmittedSearchFilters, setLastSubmittedSearchFilters] = useState<MailboxSearchFilter[] | undefined>(
    undefined
  );

  return (
    <SearchContext.Provider
      value={{
        category,
        isSearchInProgress,
        mailboxQuery,
        cmdPaletteQuery,
        lastSubmittedMailboxQuery,
        searchResults,
        searchFilters,
        searchSortOrder,
        lastSubmittedSearchFilters,
        setMailboxQuery,
        setCmdPaletteQuery,
        setLastSubmittedMailboxQuery,
        setSearchResults,
        setCategory,
        setIsSearchInProgress,
        setSearchFilters,
        setSearchSortOrder,
        setLastSubmittedSearchFilters
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
