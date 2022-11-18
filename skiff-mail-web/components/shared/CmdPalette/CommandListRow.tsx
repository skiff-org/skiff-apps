import { Typography } from 'nightwatch-ui';
import { memo } from 'react';
import { areEqual, ListChildComponentProps } from 'react-window';

import { SearchFilter, SearchItem } from '../../../utils/searchWorkerUtils';

import SearchResult from './SearchResult';

// component to show "No results" text in search results list
const NoResults = ({ style }: { style: React.CSSProperties }) => (
  <div style={{ ...style, display: 'flex', alignItems: 'center', margin: '4px 20px', width: '96%' }}>
    <Typography color='white' level={2} type='label'>
      No results
    </Typography>
  </div>
);

interface CommandListRowProps {
  highlightedRow: number;
  query: string;
  contentSearch: boolean;
  onSearchResultSelect: (index: number) => void;
  applyFilter: (filter: SearchFilter) => void;
}

export const CommandListRow = memo(function CommandListRow({
  index,
  style,
  data,
  highlightedRow,
  onSearchResultSelect,
  query,
  contentSearch,
  applyFilter
}: ListChildComponentProps & CommandListRowProps) {
  if (!data.length) {
    return <NoResults style={style} />;
  } else {
    const searchResult = data[index] as SearchItem;
    return (
      <SearchResult
        active={index === highlightedRow}
        applyFilter={applyFilter}
        isFirstRow={index === 0}
        item={searchResult}
        onClick={() => onSearchResultSelect(index)}
        query={query}
        showContent={contentSearch}
        style={style}
      />
    );
  }
},
areEqual);
