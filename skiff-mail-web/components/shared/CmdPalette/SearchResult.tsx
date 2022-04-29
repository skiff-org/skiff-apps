import { Avatar, Chip, ClickType, eventOfClickType, Icon, Icons, Typography } from '@skiff-org/skiff-ui';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import styled from 'styled-components';

import { stringToColorProp } from '../../../../skiff-ui/src/utils/colorUtils';
import { upperCaseFirstLetter } from '../../../utils/jsUtils';
import { SYSTEM_LABELS } from '../../../utils/label';
import { SearchFilterType, SearchItem, SearchItemType } from '../../../utils/searchWorkerUtils';
import { getWordsSurroundingQuery } from '../../../utils/stringUtils';
import { Highlight } from './Highlight';

export type SearchResultProps = {
  active: boolean;
  item: SearchItem;
  query: string;
  showContent: boolean;
  style?: React.CSSProperties;
  onClick?: (newTab: boolean) => void;
};

const DateText = styled(Typography)`
  position: absolute;
  right: 12px;
`;

const CmdHint = styled(Typography)`
  position: absolute;
  margin-top: -4px;
  right: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 4px;
  box-sizing: border-box;

  background: rgba(255, 255, 255, 0.12);
  border-radius: 4px;
`;

const IconChip = styled.div`
  display: flex;
  gap: 8px;
`;

const SearchLabels = styled.div`
  display: flex;
  gap: 8px;
`;

const BackgroundActiveMask = styled(motion.div)`
  background: rgba(255, 255, 255, 0.12);
  height: 60px;
  border-radius: 8px;
  width: 100%;
  position: absolute;
  margin: 0 auto;
`;

const BackgroundHoverMask = styled(motion.div)`
  background: rgba(255, 255, 255, 0.08);
  height: 60px;
  border-radius: 8px;
  width: 100%;
  position: absolute;
  margin: 0 auto;
`;

function SearchResultContent(props: { emailBody: string; query: string; sender?: string }) {
  const { emailBody, query, sender } = props;
  return <Highlight query={query} sender={sender} size='small' text={getWordsSurroundingQuery(emailBody, query)} />;
}

const getSvg = (item: SearchItem) => {
  if (item.itemType === SearchItemType.Action) {
    // Safe to spread props since IconProps is clearly defined
    return <Icons themeMode='dark' {...item.iconProps} size='large' />;
  } else if (item.itemType === SearchItemType.Filter) {
    return <Icons icon={Icon.Search} size='large' themeMode='dark' />;
  } else {
    return null;
  }
};

export default function SearchResult({ active, item, query, style, showContent, onClick }: SearchResultProps) {
  const { itemType, subject } = item;
  const [hover, setHover] = useState(false);
  if (itemType === SearchItemType.Header) {
    return (
      <div className='searchResultHeaderRow' onKeyPress={() => {}} style={style} tabIndex={-1}>
        <Typography color='secondary' themeMode='dark' type='label'>
          {subject}
        </Typography>
      </div>
    );
  }

  const onSearchResultClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (!onClick) return;
    if (eventOfClickType(event, [ClickType.Middle, ClickType.Meta, ClickType.Ctrl])) {
      onClick(true);
    } else if (eventOfClickType(event, [ClickType.Left])) {
      onClick(false);
    }
  };

  if (itemType === SearchItemType.Filter) {
    let filterPrefix = '';
    switch (item.filter.filterType) {
      case SearchFilterType.SystemLabel:
      case SearchFilterType.UserLabel:
        filterPrefix = 'In';
        break;
      case SearchFilterType.FromAddress:
        filterPrefix = 'From';
        break;
      case SearchFilterType.ToAddress:
        filterPrefix = 'To';
        break;
      default:
        break;
    }
    const systemIcon = SYSTEM_LABELS.find((label) => label.name.toUpperCase() === subject)?.icon;
    const isAddress =
      item.filter.filterType === SearchFilterType.FromAddress || item.filter.filterType === SearchFilterType.ToAddress;
    const startIcon = isAddress ? (
      <Avatar label={subject} size='xsmall' themeMode='dark' />
    ) : (
      <Icons color={systemIcon ? 'white' : stringToColorProp(subject)} icon={systemIcon || Icon.Dot} />
    );

    return (
      <div
        className='searchResultRow'
        onKeyPress={() => {}}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onMouseUp={onSearchResultClick}
        style={style}
        tabIndex={-1}
      >
        {active && <BackgroundActiveMask layoutId='highlight-active-background' />}
        {hover && !active && <BackgroundHoverMask layoutId='highlight-hover-background' />}
        <div className='searchResultIcon'>{getSvg(item)}</div>
        <IconChip>
          <Typography themeMode='dark' type='paragraph'>
            {filterPrefix}
          </Typography>
          <Chip
            key={subject}
            label={isAddress ? subject : upperCaseFirstLetter(subject)}
            size='small'
            startIcon={startIcon}
            themeMode='dark'
            type='tag'
          />
        </IconChip>
      </div>
    );
  }
  return (
    <>
      <div
        className='searchResultRow'
        data-test='search-row-results'
        id={item.subject}
        onKeyPress={() => {}}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onMouseUp={onSearchResultClick}
        role='button'
        style={style}
        tabIndex={-1}
      >
        {active && <BackgroundActiveMask layoutId='highlight-active-background' />}
        {hover && !active && <BackgroundHoverMask layoutId='highlight-hover-background' />}
        <div className='searchResultIcon'>{getSvg(item)}</div>
        <div className='searchResultContent' data-test={`search-result-${subject}`}>
          <SearchLabels>
            <Highlight query={query} text={subject} />
            {itemType === SearchItemType.Skemail &&
              item.userLabels.map((userLabel) => (
                <Chip
                  key={userLabel}
                  label={userLabel}
                  size='small'
                  startIcon={<Icons color={stringToColorProp(userLabel)} icon={Icon.Dot} />}
                  themeMode='dark'
                  type='tag'
                />
              ))}
          </SearchLabels>
          {showContent && itemType === SearchItemType.Skemail && (
            <SearchResultContent emailBody={item.content} query={query} sender={item.from.name || item.from.address} />
          )}
          {/* Render date for Skemail search results */}
          {itemType === SearchItemType.Skemail && (
            <DateText color='secondary' themeMode='dark' type='paragraph'>
              {dayjs(item.createdAt).format('MMM D')}
            </DateText>
          )}
          {/* Render cmd tooltip for quick action results */}
          {itemType === SearchItemType.Action && (
            <CmdHint color='secondary' themeMode='dark' type='paragraph'>
              {item.cmdTooltip}
            </CmdHint>
          )}
        </div>
      </div>
    </>
  );
}
