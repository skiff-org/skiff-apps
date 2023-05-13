import noop from 'lodash/noop';
import { createContext, useEffect, useState } from 'react';

import { SearchResult, SkemailResultIDs } from './searchTypes';

// Search categories are used to represent the different types that can show up in search
// results. For example, the `USER` search result will contain profile picture, email, address ...etc
// while the `SKEMAIL` search result will have subject, content ...etc.
export enum SearchCategory {
  SKEMAIL,
  LABEL,
  USER,
  ATTACHMENT
}

interface SearchContextProps {
  category: SearchCategory;
  fullView: boolean;
  query: string;
  searchResults: SearchResult[] | undefined;
  showFullViewButton: boolean;
  isNewSearch: boolean;
  setQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[] | undefined) => void;
  setFullView: (fv: boolean) => void;
  setCategory: (category: SearchCategory) => void;
  setActiveResult: (activeResult?: SkemailResultIDs) => void;
  activeResult?: SkemailResultIDs;
  setIsNewSearch: (isNew: boolean) => void;
}

export interface SearchConfig {
  defaultCategory?: SearchCategory;
  fullView?: boolean;
}

export const SearchContext = createContext<SearchContextProps>({
  activeResult: undefined,
  category: SearchCategory.SKEMAIL,
  fullView: false,
  query: '',
  searchResults: undefined,
  showFullViewButton: false,
  isNewSearch: true,
  setQuery: noop,
  setSearchResults: noop,
  setFullView: noop,
  setCategory: noop,
  setActiveResult: noop,
  setIsNewSearch: noop
});

// Components that need access to the search provider should be wrapped in the SearchProvider
export const SearchProvider = ({ children, config }: { children?: React.ReactNode; config?: SearchConfig }) => {
  const [category, setCategory] = useState<SearchCategory>(config?.defaultCategory ?? SearchCategory.SKEMAIL);
  const [fullView, setFullView] = useState(config?.fullView ?? false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[] | undefined>([]);
  const [activeResult, setActiveResult] = useState<SkemailResultIDs>();
  const [isNewSearch, setIsNewSearch] = useState(true);

  // full view is only meant for skemails, so we should only allow the user to enter full view search when they are looking for skemails
  const showFullViewButton = category === SearchCategory.SKEMAIL;

  // if changing from fullView -> cmdpalette, the query and search results should reset
  useEffect(() => {
    if (!fullView) {
      setQuery('');
      setSearchResults([]);
      setIsNewSearch(true);
    }
  }, [fullView]);

  return (
    <SearchContext.Provider
      value={{
        activeResult,
        category,
        fullView,
        showFullViewButton,
        isNewSearch,
        query,
        searchResults,
        setQuery,
        setSearchResults,
        setFullView,
        setCategory,
        setActiveResult,
        setIsNewSearch
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
