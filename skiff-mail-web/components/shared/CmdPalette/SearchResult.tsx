import dayjs from 'dayjs';
import {
  Chip,
  ClickType,
  eventOfClickType,
  getThemedColor,
  Icon,
  IconColor,
  Icons,
  KeyCodeSequence,
  Size,
  ThemeMode,
  Typography,
  TypographyWeight
} from '@skiff-org/skiff-ui';
import React from 'react';
import { useUserLabelsQuery } from 'skiff-front-graphql';
import { UserLabelVariant } from 'skiff-graphql';
import styled from 'styled-components';

import { NO_SUBJECT_TEXT } from '../../../constants/mailbox.constants';
import {
  DATE_TEXT_RIGHT,
  GAP_BETWEEN_UNREAD_INDICATOR_AND_DATE_TEXT,
  MAX_DATE_WIDTH,
  UNREAD_INDICATOR_DIAMETER
} from '../../../constants/search.constants';
import {
  getFilterPrefix,
  getRowHeightFromSearchItem,
  SearchCategoryType,
  SearchItem,
  SearchItemType
} from '../../../utils/searchWorkerUtils';
import { getWordsSurroundingQuery } from '../../../utils/stringUtils';
import { UnreadIndicator } from '../../mailbox/MessageCell/MessageCell.styles';
import FilterChip from '../FilterChip';

import { AttachmentSearchResult } from './AttachmentSearchResult';
import { SEARCH_ITEM_DEFAULT_TYPOGRAPHY_SIZE } from './constants';
import { ContactSearchResult } from './ContactSearchResult';
import { Highlight } from './Highlight';
import { BackgroundActiveMask } from './SearchResultMasks';
import { UserLabelSearchResult } from './UserLabelSearchResult';

export type SearchResultProps = {
  active: boolean;
  isFirstRow?: boolean;
  item: SearchItem;
  query: string;
  showContent: boolean;
  style?: React.CSSProperties;
  onClick?: (newTab: boolean) => void;
  onHover: () => void;
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
  border-radius: 12px;
  cursor: pointer;
`;

const SearchResultContainer = styled.div`
  padding: 10px;
  box-sizing: border-box;
  display: flex;
  width: 100%;
  gap: 12px;
  box-sizing: border-box;
  align-items: center;
`;

const SearchResultContentArea = styled.div<{ isAction?: boolean }>`
  flex: 1;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  min-width: 0;
  ${(props) => props.isAction && `justify-content: center;`}
  pointer-events: none;
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
  box-sizing: border-box;

  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;

  width: 36px;
  height: 36px;

  background: ${getThemedColor('var(--cta-secondary-hover)', ThemeMode.DARK)};
  border: 1px solid ${getThemedColor('var(--border-tertiary)', ThemeMode.DARK)};

  border-radius: 8px;
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

export const renderRowBackground = (active: boolean, rowHeight: number) => (
  <>{active && <BackgroundActiveMask rowHeight={rowHeight} />}</>
);

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
        <Icons color='secondary' forceTheme={ThemeMode.DARK} {...item.iconProps} size={Size.X_MEDIUM} />
      </StartElement>
    );
  }
};

export default function SearchResult({
  active,
  isFirstRow,
  item,
  query,
  style,
  showContent,
  onClick,
  onHover
}: SearchResultProps) {
  const { itemType, subject } = item;
  const { data: userLabelData } = useUserLabelsQuery();
  const userLabels = userLabelData?.userLabels ?? [];

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
        <Typography
          color='disabled'
          forceTheme={ThemeMode.DARK}
          mono
          size={SEARCH_ITEM_DEFAULT_TYPOGRAPHY_SIZE}
          uppercase
          weight={TypographyWeight.MEDIUM}
        >
          {subject}
        </Typography>
        {item.showAllOptions && onClick && (
          <Typography
            color='link'
            forceTheme={ThemeMode.DARK}
            onClick={() => onClick(false)}
            size={SEARCH_ITEM_DEFAULT_TYPOGRAPHY_SIZE}
            weight={TypographyWeight.MEDIUM}
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
        <SearchResultRow onMouseEnter={onHover} onMouseUp={onSearchResultClick} style={style} tabIndex={-1}>
          <SelectableChips>
            <FilterChip noBorder prefix={filterPrefix} searchFilter={item} userLabels={userLabels} />
            {item.query && <Typography forceTheme={ThemeMode.DARK}>{item.query}</Typography>}
          </SelectableChips>
        </SearchResultRow>
      );
    }
  } else if (itemType === SearchItemType.Query) {
    return (
      <SearchResultRow onMouseEnter={onHover} onMouseUp={onSearchResultClick} style={style} tabIndex={-1}>
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
            {!query.length && <Typography forceTheme={ThemeMode.DARK}>{subject}</Typography>}
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
            contact={{ name: info.displayName, address: info.address }}
            onMouseUp={onSearchResultClick}
            query={query}
            style={style}
            subject={item.subject}
          />
        );
      }

      if (info.categoryType === SearchCategoryType.Attachments) {
        return (
          <AttachmentSearchResult
            attachment={info}
            onMouseUp={onSearchResultClick}
            query={query}
            style={style}
            subject={item.subject}
          />
        );
      }
      if (info.categoryType === SearchCategoryType.Labels || info.categoryType === SearchCategoryType.Folders) {
        return (
          <UserLabelSearchResult
            label={info}
            onMouseUp={onSearchResultClick}
            query={query}
            style={style}
            subject={item.subject}
          />
        );
      }
    }
  }
  return (
    <>
      <SearchResultRow
        data-test='search-row-results'
        id={item.subject}
        onMouseEnter={onHover}
        onMouseUp={onSearchResultClick}
        role='button'
        style={style}
        tabIndex={-1}
      >
        {renderRowBackground(active, getRowHeightFromSearchItem(item))}
        <SearchResultContainer>
          {renderStartElement(item)}
          <SearchResultContentArea
            data-test={`search-result-${subject}`}
            isAction={item.itemType === SearchItemType.Action}
          >
            <SearchLabels>
              {/* no need to highlight queries for emails without subjects */}
              {!(itemType === SearchItemType.Skemail && !subject) ? (
                <Highlight
                  customColor='white'
                  isAction={item.itemType === SearchItemType.Action}
                  query={query}
                  read={itemType === SearchItemType.Skemail ? item.read : undefined}
                  size='small'
                  text={subject}
                />
              ) : (
                <Typography
                  color={item.read === false ? 'primary' : 'secondary'}
                  forceTheme={ThemeMode.DARK}
                  size={SEARCH_ITEM_DEFAULT_TYPOGRAPHY_SIZE}
                  weight={item.read === false ? TypographyWeight.MEDIUM : TypographyWeight.REGULAR}
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
                      forceTheme={ThemeMode.DARK}
                      icon={
                        <Icons color={labelOrFolderColor as IconColor} icon={labelOrFolderIcon} size={Size.SMALL} />
                      }
                      key={userLabel}
                      label={userLabel}
                      noBorder
                      size={Size.SMALL}
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
                <UnreadIndicator $cellTransition={false} $forceTheme={ThemeMode.DARK} $read={item.read} />
                <Typography color='secondary' forceTheme={ThemeMode.DARK} size={SEARCH_ITEM_DEFAULT_TYPOGRAPHY_SIZE}>
                  {dayjs(item.createdAt).format('MMM D')}
                </Typography>
              </SkemailMetaDataArea>
            )}
            {/* Render cmd tooltip for quick action results */}
            {itemType === SearchItemType.Action && item.cmdTooltip && (
              <CmdHint>
                <KeyCodeSequence shortcut={item.cmdTooltip} size={Size.LARGE} />
              </CmdHint>
            )}
          </SearchResultContentArea>
        </SearchResultContainer>
      </SearchResultRow>
    </>
  );
}
