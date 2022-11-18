import { noop } from 'lodash';
import { createContext, useEffect, useState } from 'react';

import { SearchModifierType } from './searchModifiers';
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
  modifierType?: SearchModifierType;
  modifierValue?: string;
  fullView: boolean;
  query: string;
  searchResults: SearchResult[] | undefined;
  showFullViewButton: boolean;
  isNewSearch: boolean;
  setQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[] | undefined) => void;
  setFullView: (fv: boolean) => void;
  setCategory: (category: SearchCategory) => void;
  setModifier: (value?: { type: SearchModifierType; value: string }) => void;
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
  setModifier: noop,
  setActiveResult: noop,
  setIsNewSearch: noop
});

// Components that need access to the search provider should be wrapped in the SearchProvider
export const SearchProvider = ({ children, config }: { children?: React.ReactNode; config?: SearchConfig }) => {
  const [category, setCategory] = useState<SearchCategory>(config?.defaultCategory ?? SearchCategory.SKEMAIL);
  const [type, setType] = useState<SearchModifierType | undefined>();
  const [value, setValue] = useState<string | undefined>();
  const [fullView, setFullView] = useState(config?.fullView ?? false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[] | undefined>([]);
  const [activeResult, setActiveResult] = useState<SkemailResultIDs>();
  const [isNewSearch, setIsNewSearch] = useState(true);

  // full view is only meant for skemails, so we should only allow the user to enter full view search when they are looking for skemails
  const showFullViewButton = category === SearchCategory.SKEMAIL && type !== undefined && !!value;

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
        modifierType: type,
        modifierValue: value,
        fullView,
        showFullViewButton,
        isNewSearch,
        query,
        searchResults,
        setQuery,
        setSearchResults,
        setFullView,
        setCategory,
        setModifier: (val) => {
          setType(val?.type);
          setValue(val?.value);
        },
        setActiveResult,
        setIsNewSearch
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
