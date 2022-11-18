import { ClickType, eventOfClickType } from '@skiff-org/skiff-ui';
import dayjs from 'dayjs';
import { Chip, Icon, IconProps, Icons, KeyCodeSequence, Typography } from 'nightwatch-ui';
import React, { useState } from 'react';
import { UserLabelVariant } from 'skiff-graphql';
import { useUserLabelsQuery } from 'skiff-mail-graphql';
import { upperCaseFirstLetter } from 'skiff-utils';
import styled from 'styled-components';

import { NO_SUBJECT_TEXT } from '../../../constants/mailbox.constants';
import {
  DATE_TEXT_RIGHT,
  MAX_DATE_WIDTH,
  UNREAD_INDICATOR_DIAMETER,
  GAP_BETWEEN_UNREAD_INDICATOR_AND_DATE_TEXT
} from '../../../constants/search.constants';
import {
  FilterByType,
  getFilterPrefix,
  getRowHeightFromSearchItem,
  SearchCategoryType,
  SearchFilter,
  SearchFilterType,
  SearchItem,
  SearchItemType
} from '../../../utils/searchWorkerUtils';
import { getWordsSurroundingQuery } from '../../../utils/stringUtils';
import { UnreadIndicator } from '../../mailbox/MessageCell/MessageCell.styles';
import FilterChip from '../FilterChip';

import { AttachmentSearchResult } from './AttachmentSearchResult';
import { CELL_HOVER_SWITCH_ANIMATION_DURATION } from './constants';
import { SEARCH_ITEM_DEFAULT_TYPOGRAPHY_LEVEL } from './constants';
import { ContactSearchResult } from './ContactSearchResult';
import { Highlight } from './Highlight';
import { InactiveFilterChip } from './InactiveFilterChip';
import { BackgroundActiveMask, BackgroundHoverMask } from './SearchResultMasks';
import { UserLabelSearchResult } from './UserLabelSearchResult';

export type SearchResultProps = {
  active: boolean;
  isFirstRow?: boolean;
  item: SearchItem;
  query: string;
  showContent: boolean;
  style?: React.CSSProperties;
  onClick?: (newTab: boolean) => void;
  applyFilter: (filter: SearchFilter) => void;
};

// No need for as much padding-top for first header
// DATE_TEXT_RIGHT aligns the 'View all' button with dates and command hints
const SearchResultHeaderRow = styled.div<{ isFirstRow?: boolean }>`
  cursor: default;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${(props) => (props.isFirstRow ? '12px' : '24px')} ${DATE_TEXT_RIGHT} 8px 8px;
`;

const SearchResultRow = styled.div`
  box-sizing: border-box;
  border-radius: 8px;
  display: flex;
  align-items: center;
  & * {
    cursor: pointer;
  }
`;

const SearchResultContentArea = styled.div<{ isAction?: boolean }>`
  flex: 1;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  min-width: 0;
  ${(props) => props.isAction && `justify-content: center;`}
  pointer-events: none;
  & span.outerText:first-child {
    color: white !important;
  }
  padding-left: ${(props) => (props.isAction ? `0px` : `8px`)};
`;

const CmdHint = styled.div`
  position: absolute;
  right: ${DATE_TEXT_RIGHT};
`;

const SelectableChips = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px;
`;

const SearchLabels = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: calc(
    100% - ${MAX_DATE_WIDTH} - ${DATE_TEXT_RIGHT} - ${UNREAD_INDICATOR_DIAMETER} -
      ${GAP_BETWEEN_UNREAD_INDICATOR_AND_DATE_TEXT}
  );
`;

const StartElement = styled.div`
  padding-left: 8px;
  padding-right: 4px;
  pointer-events: none;
`;

const SkemailMetaDataArea = styled.div`
  display: flex;
  align-items: center;
  gap: ${GAP_BETWEEN_UNREAD_INDICATOR_AND_DATE_TEXT};
  position: absolute;
  right: ${DATE_TEXT_RIGHT};
`;

const EmailContentArea = styled.div`
  max-width: calc(100% - ${DATE_TEXT_RIGHT});
`;

function SearchResultContent(props: { emailBody: string; query: string; sender?: string; read?: boolean }) {
  const { emailBody, query, sender, read } = props;
  return (
    <EmailContentArea>
      <Highlight
        query={query}
        read={read}
        sender={sender}
        size='small'
        text={getWordsSurroundingQuery(emailBody, query)}
      />
    </EmailContentArea>
  );
}

// render icons for actions
// 'Narrow search' filter chips do not get a StartElement because they get an in-chip icon
const renderStartElement = (item: SearchItem) => {
  const isAction = item.itemType === SearchItemType.Action;
  if (isAction) {
    return (
      <StartElement>
        {/* Safe to spread props since IconProps is clearly defined */}
        <Icons themeMode='dark' {...item.iconProps} size='small' />
      </StartElement>
    );
  }
};

export const renderRowBackground = (active: boolean, hover: boolean, rowHeight: number) => (
  <>
    {active && (
      <BackgroundActiveMask
        layoutId='highlight-active-background'
        rowHeight={rowHeight}
        transition={{ duration: CELL_HOVER_SWITCH_ANIMATION_DURATION }}
      />
    )}
    {hover && !active && (
      <BackgroundHoverMask
        layoutId='highlight-hover-background'
        rowHeight={rowHeight}
        transition={{ duration: CELL_HOVER_SWITCH_ANIMATION_DURATION }}
      />
    )}
  </>
);

export default function SearchResult({
  active,
  isFirstRow,
  item,
  query,
  style,
  showContent,
  onClick,
  applyFilter
}: SearchResultProps) {
  const { itemType, subject } = item;
  const { data: userLabelData } = useUserLabelsQuery();
  const userLabels = userLabelData?.userLabels ?? [];
  const [hover, setHover] = useState(false);

  const onSearchResultClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (!onClick) return;
    if (eventOfClickType(event, [ClickType.Middle, ClickType.Meta, ClickType.Ctrl])) {
      onClick(true);
    } else if (eventOfClickType(event, [ClickType.Left])) {
      onClick(false);
    }
  };

  if (itemType === SearchItemType.Header) {
    return (
      <SearchResultHeaderRow isFirstRow={isFirstRow} style={style} tabIndex={-1}>
        <Typography color='secondary' level={SEARCH_ITEM_DEFAULT_TYPOGRAPHY_LEVEL} themeMode='dark' type='label'>
          {subject}
        </Typography>
        {item.showAllOptions && onClick && (
          <Typography
            color='link'
            level={SEARCH_ITEM_DEFAULT_TYPOGRAPHY_LEVEL}
            onClick={() => onClick(false)}
            themeMode='dark'
            type='label'
          >
            {item.onClickText}
          </Typography>
        )}
      </SearchResultHeaderRow>
    );
  } else if (itemType === SearchItemType.Filter) {
    if (item.filter) {
      const filterPrefix = getFilterPrefix(item.filter.filterType);
      return (
        <SearchResultRow
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onMouseUp={onSearchResultClick}
          style={style}
          tabIndex={-1}
        >
          {renderRowBackground(active, hover, getRowHeightFromSearchItem(item))}
          <SelectableChips>
            <FilterChip noBorder prefix={filterPrefix} searchFilter={item} userLabels={userLabels} />
            {item.query && <Typography themeMode='dark'>{item.query}</Typography>}
          </SelectableChips>
        </SearchResultRow>
      );
    }
  } else if (itemType === SearchItemType.FilterRow) {
    return (
      <SearchResultRow style={style}>
        <SelectableChips>
          {item.filters.map((filter) => (
            <Chip
              color='white'
              key={filter.subject}
              label={filter.subject}
              noBorder
              onClick={() => applyFilter(filter)}
              size='small'
              themeMode='dark'
              typographyType='label'
            />
          ))}
        </SelectableChips>
      </SearchResultRow>
    );
  } else if (itemType === SearchItemType.Query) {
    return (
      <SearchResultRow
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onMouseUp={onSearchResultClick}
        style={style}
        tabIndex={-1}
      >
        {renderRowBackground(active, hover, getRowHeightFromSearchItem(item))}
        {
          <SelectableChips>
            {item.filters.map((filter) => {
              const filterPrefix = getFilterPrefix(filter.filter.filterType);
              return (
                <FilterChip
                  key={filter.subject}
                  noBorder={true}
                  prefix={filterPrefix}
                  searchFilter={filter}
                  userLabels={userLabels}
                />
              );
            })}
            {!!query.length && <Highlight query={query} text={subject} />}
            {!query.length && <Typography themeMode='dark'>{subject}</Typography>}
          </SelectableChips>
        }
      </SearchResultRow>
    );
  } else if (itemType === SearchItemType.Category) {
    if (item.categoryInfo) {
      const info = item.categoryInfo;
      if (info.categoryType === SearchCategoryType.Contact) {
        return (
          <ContactSearchResult
            active={active}
            contact={{ name: info.displayName, address: info.address }}
            hover={hover}
            onMouseUp={onSearchResultClick}
            query={query}
            rowHeight={getRowHeightFromSearchItem(item)}
            setHover={setHover}
            style={style}
            subject={item.subject}
          />
        );
      }

      if (info.categoryType === SearchCategoryType.Attachments) {
        return (
          <AttachmentSearchResult
            active={active}
            attachment={info}
            hover={hover}
            onMouseUp={onSearchResultClick}
            query={query}
            rowHeight={getRowHeightFromSearchItem(item)}
            setHover={setHover}
            style={style}
            subject={item.subject}
          />
        );
      }
      if (info.categoryType === SearchCategoryType.Labels || info.categoryType === SearchCategoryType.Folders) {
        return (
          <UserLabelSearchResult
            active={active}
            hover={hover}
            label={info}
            onMouseUp={onSearchResultClick}
            query={query}
            rowHeight={getRowHeightFromSearchItem(item)}
            setHover={setHover}
            style={style}
            subject={item.subject}
          />
        );
      }
    } else {
      const searchCategoryChips = Object.values(FilterByType);
      return (
        <SearchResultRow style={style}>
          <SelectableChips>
            {searchCategoryChips.map((filterType) => (
              <InactiveFilterChip
                applyFilter={applyFilter}
                filter={{
                  itemType: SearchItemType.Filter,
                  subject: upperCaseFirstLetter(filterType),
                  filter: { filterType: SearchFilterType.Category, filterValue: filterType }
                }}
                key={filterType}
              />
            ))}
          </SelectableChips>
        </SearchResultRow>
      );
    }
  }
  return (
    <SearchResultRow
      data-test='search-row-results'
      id={item.subject}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseUp={onSearchResultClick}
      role='button'
      style={style}
      tabIndex={-1}
    >
      {renderRowBackground(active, hover, getRowHeightFromSearchItem(item))}
      {renderStartElement(item)}
      <SearchResultContentArea
        data-test={`search-result-${subject}`}
        isAction={item.itemType === SearchItemType.Action}
      >
        <SearchLabels>
          {/* no need to highlight queries for emails without subjects */}
          {!(itemType === SearchItemType.Skemail && !subject) ? (
            <Highlight
              query={query}
              read={itemType === SearchItemType.Skemail ? item.read : undefined}
              size='small'
              text={subject}
            />
          ) : (
            <Typography
              color={item.read === false ? 'primary' : 'secondary'}
              level={SEARCH_ITEM_DEFAULT_TYPOGRAPHY_LEVEL}
              themeMode='dark'
              type={item.read === false ? 'label' : 'paragraph'}
            >
              {NO_SUBJECT_TEXT}
            </Typography>
          )}
          {itemType === SearchItemType.Skemail &&
            item.userLabels.map((userLabel) => {
              const currentLabel = userLabels.find(
                (label) => label.labelName.toLowerCase() === userLabel.toLowerCase()
              );
              const labelOrFolderColor = currentLabel?.color;
              const labelOrFolderIcon = currentLabel?.variant === UserLabelVariant.Folder ? Icon.Folder : Icon.Tag;
              return (
                <Chip
                  color='white'
                  key={userLabel}
                  label={userLabel}
                  noBorder
                  size='small'
                  startIcon={
                    <Icons
                      color={labelOrFolderColor as IconProps['color']}
                      icon={labelOrFolderIcon}
                      size='small'
                      themeMode='dark'
                    />
                  }
                  themeMode='dark'
                />
              );
            })}
        </SearchLabels>
        {showContent && itemType === SearchItemType.Skemail && (
          <SearchResultContent
            emailBody={item.content}
            query={query}
            read={item.read}
            sender={item.from.name || item.from.address}
          />
        )}
        {/* Render date and read status for Skemail search results */}
        {itemType === SearchItemType.Skemail && (
          <SkemailMetaDataArea>
            <UnreadIndicator $cellTransition={false} $read={item.read} $themeMode='dark' />
            <Typography color='secondary' level={SEARCH_ITEM_DEFAULT_TYPOGRAPHY_LEVEL} themeMode='dark'>
              {dayjs(item.createdAt).format('MMM D')}
            </Typography>
          </SkemailMetaDataArea>
        )}
        {/* Render cmd tooltip for quick action results */}
        {itemType === SearchItemType.Action && item.cmdTooltip && (
          <CmdHint color='primary'>
            <KeyCodeSequence shortcut={item.cmdTooltip} size='medium' />
          </CmdHint>
        )}
      </SearchResultContentArea>
    </SearchResultRow>
  );
}
