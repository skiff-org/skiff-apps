import { getThemedColor, Icon, Icons, Size, ThemeMode, Typography } from '@skiff-org/skiff-ui';
import { memo } from 'react';
import { areEqual, ListChildComponentProps } from 'react-window';
import styled from 'styled-components';

import { SkemailResultIDs } from '../../../utils/search/searchTypes';
import { SearchItem } from '../../../utils/searchWorkerUtils';

import { NO_RESULTS_ROW_HEIGHT } from './constants';
import SearchResult from './SearchResult';
import { BackgroundActiveMask } from './SearchResultMasks';

const StartElement = styled.div`
  box-sizing: border-box;

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 8px;

  width: 36px;
  height: 36px;

  background: ${getThemedColor('var(--cta-secondary-hover)', ThemeMode.DARK)};
  border: 1px solid ${getThemedColor('var(--border-tertiary)', ThemeMode.DARK)};

  border-radius: 12px;
  pointer-events: none;
`;

const NoResult = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  cursor: pointer;
  border-radius: 12px;
  padding: 0px 10px;
  box-sizing: border-box;
`;

const Highlight = styled.span`
  color: ${getThemedColor('var(--text-primary)', ThemeMode.DARK)};
`;

const NoResultRow = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

// component to show "No results" text in search results list
const NoResults = ({
  style,
  query,
  goToFullViewSearch
}: {
  style: React.CSSProperties;
  query: string;
  goToFullViewSearch: (activeResult?: SkemailResultIDs, currQuery?: string) => void;
}) => (
  <NoResultRow
    onClick={() => {
      goToFullViewSearch(undefined, query);
    }}
    style={style}
  >
    {/* Always show highlighted state because it will be the only row with no results  */}
    <BackgroundActiveMask rowHeight={NO_RESULTS_ROW_HEIGHT} />
    <NoResult>
      <StartElement>
        <Icons color='secondary' forceTheme={ThemeMode.DARK} icon={Icon.Search} size={Size.X_MEDIUM} />
      </StartElement>
      <Typography mono uppercase color='secondary' forceTheme={ThemeMode.DARK}>
        Search emails for <Highlight>{query}</Highlight>
      </Typography>
    </NoResult>
  </NoResultRow>
);

interface CommandListRowProps {
  highlightedRow: number;
  query: string;
  contentSearch: boolean;
  onSearchResultSelect: (index: number) => void;
  goToFullViewSearch: (activeResult?: SkemailResultIDs, currQuery?: string) => void;
  setHighlightedRow: (number) => void;
}

export const CommandListRow = memo(function CommandListRow({
  index,
  style,
  data,
  highlightedRow,
  onSearchResultSelect,
  query,
  goToFullViewSearch,
  contentSearch,
  setHighlightedRow
}: ListChildComponentProps & CommandListRowProps) {
  if (!data.length) {
    return <NoResults goToFullViewSearch={goToFullViewSearch} query={query} style={style} />;
  } else {
    const searchResult = data[index] as SearchItem;
    return (
      <SearchResult
        active={index === highlightedRow}
        isFirstRow={index === 0}
        item={searchResult}
        onClick={() => onSearchResultSelect(index)}
        onHover={() => setHighlightedRow(index)}
        query={query}
        showContent={contentSearch}
        style={style}
      />
    );
  }
},
areEqual);
