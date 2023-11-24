import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  FilledVariant,
  Icon,
  IconButton,
  IconProps,
  Icons,
  MonoTag,
  Size,
  Type,
  Typography,
  TypographySize
} from 'nightwatch-ui';
import React, { useState } from 'react';
import { bytesToHumanReadable } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { IPFS_BASE_URL } from '../../../../constants/routes.constants';
import { useFilePreview, useMediaQuery } from '../../../../hooks';
import { FileTypes, fileTypeMatcher } from '../../../../utils';
import Checkbox from '../../../Checkbox';
import { DateDisplay } from '../../../Date';
import { ImagePreview, PreviewObject } from '../../RecentFilePreview';
import { EndContainer, MetadataColumn, MetadataContainer } from '../FileTableHeader/FileTableHeader';
import {
  FILE_TABLE_BREAKPOINT_1,
  FILE_TABLE_BREAKPOINT_2,
  FILE_TABLE_BREAKPOINT_3
} from '../FileTableHeader/FileTableHeader.constants';

interface IMenuItem {
  dataTest?: string;
  label: string;
  icon?: IconProps['icon'];
  onClick: (evt?: React.MouseEvent<Element, MouseEvent>) => void;
  content?: JSX.Element;
}

const FILE_TABLE_FILE_CARD_PX_HEIGHT = 40;
const ROW_HORIZONTAL_PADDING = 20;
const CHECKBOX_HORIZONTAL_PADDING = 12;

const RowLabel = styled.div<{ active: boolean; isOver?: boolean; $checkboxVisible?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  // Less padding on the left since the checkbox has extra padding for clickable area
  padding: 12px ${ROW_HORIZONTAL_PADDING}px 12px ${ROW_HORIZONTAL_PADDING - CHECKBOX_HORIZONTAL_PADDING}px;
  box-sizing: border-box;
  flex: none;
  align-self: stretch;
  cursor: pointer;
  width: 100%;
  border-radius: ${({ $checkboxVisible }) => ($checkboxVisible ? '0px' : '4px')};
  flex-grow: 0;
  border-bottom: 1px solid var(--border-tertiary);
  height: 56px;
  justify-content: center;
  ${(props) =>
    props.isOver &&
    css`
      background: var(--bg-overlay-tertiary);
      border-bottom: 1px solid var(--border-active);
    `}
  &:hover {
    background: var(--bg-overlay-tertiary);
  }
  ${({ active }) =>
    active &&
    css`
      background: var(--bg-overlay-tertiary);
    `}
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  flex: none;
  align-self: stretch;
`;

const CheckboxAndFilePreview = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  // Smaller gap to allow more clickable area for the checkbox
  gap: 4px;
`;

const NameContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  flex-direction: column;
  padding: 0px;
  max-width: 50%;
  overflow: hidden;
`;

const FileCard = styled.div<{
  $selected?: boolean;
  $isDrive?: boolean;
  $checkboxVisible?: boolean;
  $isFolder?: boolean;
}>`
  padding: 0px 6px;
  ${({ $isDrive, $checkboxVisible, $isFolder }) =>
    css`
      width: 32px;
      overflow: hidden;
      ${$isDrive &&
      `
            height: 32px;
            overflow: hidden;
            padding: 0px;
            border-radius: 8px;
            &:before {
              content: '';
              position: absolute;
              box-shadow: var(--secondary-button-border);
              z-index: 1;
              ${$checkboxVisible ? 'left: 52px;' : 'left: 8px;'}
              right: 0;
              border-radius: 8px;
              width: 32px;
              height: 32px;
            }
          `}
      ${!$isDrive &&
      `
            box-shadow: var(--secondary-button-border);
            height: ${FILE_TABLE_FILE_CARD_PX_HEIGHT}px;
            border-radius: 4px;
          `}
      height: ${$isFolder ? '32px' : ''};
      border-radius: ${$isFolder ? '8px' : ''};
    `};

  display: flex;
  align-items: center;
  justify-content: center;

  box-sizing: border-box;
  background: var(--bg-l3-solid);

  border-color: ${(props) => (props.$selected ? 'var(--border-active)' : undefined)};
`;

const HoverItemsContainer = styled.div<{ $hover?: boolean }>`
  pointer-events: ${(props) => (props.$hover ? '' : 'none')};
  opacity: ${(props) => (props.$hover ? 1 : 0)};
  position: absolute;
  display: flex;
  align-items: center;
  right: 20px;
`;

const IconShadow = styled.div`
  > div > svg {
    filter: drop-shadow(0px 1px 3px rgba(0, 0, 0, 0.2)) drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.1));
  }
`;

const FileRowPreview = ({
  icon,
  iconColor,
  selected,
  preview,
  isDrive,
  checkboxVisible,
  isFolder
}: {
  icon?: Icon;
  iconColor: IconProps['color'];
  progress?: number;
  selected?: boolean;
  preview?: PreviewObject;
  isDrive?: boolean;
  checkboxVisible?: boolean;
  isFolder?: boolean;
}) => {
  const fallbackPreview = (
    <FileCard $checkboxVisible={checkboxVisible} $isDrive={isDrive} $isFolder={isFolder} $selected={selected}>
      {!!preview?.data && <ImagePreview compact {...preview} />}
      {!preview?.data && (
        <IconShadow>
          {isFolder && <Icons color='source' icon={Icon.FolderFilled} size={Size.MEDIUM} />}
          {!isFolder && <Icons color={iconColor} icon={icon || Icon.File} size={Size.MEDIUM} />}
        </IconShadow>
      )}
    </FileCard>
  );

  return fallbackPreview;
};

// need to memoize because of a bug in the pdf preview that loads the pdf on every hover
const FilePreviewMemoized = React.memo(FileRowPreview);

export interface FileTableRowProps {
  client: ApolloClient<NormalizedCacheObject>;
  title: string;
  onClick: (e: React.MouseEvent) => void;
  isSelected?: boolean;
  hoverItems?: Array<IMenuItem>;
  onSelectToggle?: (e: React.MouseEvent) => void;
  active?: boolean;
  icon?: Icon;
  iconColor?: IconProps['color'];
  createdAt?: string | number | Date | null;
  updatedAt?: string | number | Date | null;
  ipfsData?: { ipfsPath?: string; cacheDataKey: string };
  dragOver?: boolean;
  dataTest?: string;
  id?: string;
  progress?: number;
  moreButtonRef?: React.MutableRefObject<HTMLDivElement | null>;
  docID?: string;
  isDrive?: boolean;
  isFolder?: boolean;
  forceHover?: boolean;
  isSkiffPage?: boolean;
  index?: number;
  itemsRefs?: React.MutableRefObject<HTMLDivElement | null> | React.MutableRefObject<(HTMLDivElement | null)[]>;
}

// TODO: not sure why need both active and hover
const FileTableRow: React.FC<FileTableRowProps> = ({
  client,
  title,
  ipfsData,
  dragOver,
  icon,
  onClick,
  createdAt,
  updatedAt,
  active = false,
  dataTest,
  onSelectToggle,
  isSelected = false,
  iconColor = 'secondary',
  id,
  progress,
  moreButtonRef,
  hoverItems,
  docID,
  isDrive,
  isFolder,
  forceHover,
  isSkiffPage,
  itemsRefs,
  index
}) => {
  const [hoverInner, setHover] = useState(false);
  const hover = forceHover || hoverInner;
  const { preview, loading: previewLoading } = useFilePreview({
    docID: docID ?? '',
    client,
    includeFileData: true,
    getThumbnail: true
  });

  /**
   * For Drive, we show Type, Size, Updated
   * For Pages, we show Created and Updated
   */

  const showType = useMediaQuery(`(min-width:${FILE_TABLE_BREAKPOINT_1}px)`) && isDrive;

  const showCreated = useMediaQuery(`(min-width:${FILE_TABLE_BREAKPOINT_1}px)`) && !isDrive && !!createdAt;

  const showSize = useMediaQuery(`(min-width:${FILE_TABLE_BREAKPOINT_2}px)`) && isDrive;

  const updatedBreakpoint = isDrive ? FILE_TABLE_BREAKPOINT_3 : FILE_TABLE_BREAKPOINT_2;
  const showUpdated = useMediaQuery(`(min-width:${updatedBreakpoint}px)`) && !!updatedAt;

  const isImage = fileTypeMatcher(preview?.mimeType || '', { [FileTypes.Image]: true, [FileTypes.Unknown]: false });

  const fileSizeText = preview.fileSizeBytes !== undefined ? bytesToHumanReadable(preview.fileSizeBytes) : undefined;

  const { fileTypeLabel } = preview;

  const isFile = !!preview.fileSizeBytes || !!preview.fileName || !!preview.mimeType || !!preview.data;

  return (
    <RowLabel
      $checkboxVisible={!!onSelectToggle}
      active={active}
      data-test={dataTest}
      id={id}
      isOver={dragOver}
      onClick={onClick}
      onMouseLeave={() => setHover(false)}
      onMouseOver={() => setHover(true)}
      ref={(el) => {
        if (index !== undefined && itemsRefs && Array.isArray(itemsRefs.current)) {
          itemsRefs.current[index] = el;
        }
      }}
    >
      <MainContent>
        <CheckboxAndFilePreview>
          {onSelectToggle && (
            <Checkbox
              checked={isSelected}
              clickableAreaPadding={`${FILE_TABLE_FILE_CARD_PX_HEIGHT / 2 - 16}px ${CHECKBOX_HORIZONTAL_PADDING}px`}
              hover={hover}
              onClick={onSelectToggle}
            />
          )}
          <FilePreviewMemoized
            checkboxVisible={!!onSelectToggle}
            icon={icon}
            iconColor={iconColor}
            isDrive={isFile}
            isFolder={isFolder}
            preview={isImage ? preview : undefined}
            progress={progress}
          />
        </CheckboxAndFilePreview>
        <NameContainer>
          <Typography>{title}</Typography>
        </NameContainer>
        <EndContainer>
          {!!ipfsData && (
            <IconButton
              icon={Icon.Ipfs}
              onClick={(evt: React.MouseEvent) => {
                evt.stopPropagation();
                if (!ipfsData.ipfsPath) {
                  console.error('No ipfs path');
                  return;
                }
                window.open(`${IPFS_BASE_URL}/${ipfsData.ipfsPath}`, '_blank', 'noreferrer noopener');
              }}
              tooltip={ipfsData.cacheDataKey}
              type={Type.SECONDARY}
              variant={FilledVariant.UNFILLED}
            />
          )}
          <MetadataContainer>
            {showType && (
              <MetadataColumn $hide={false}>
                {!previewLoading && isFile && <MonoTag color='secondary' label={fileTypeLabel} />}
                {!previewLoading && isSkiffPage && !isFile && <MonoTag color='secondary' label='Page' />}
              </MetadataColumn>
            )}
            {showSize && (
              <MetadataColumn $hide={false}>
                {/* Always render the outer wrapper, even if fileSize is undefined, to preserve formatting */}
                {fileSizeText && (
                  <Typography color='disabled' size={TypographySize.SMALL}>
                    {fileSizeText}
                  </Typography>
                )}
              </MetadataColumn>
            )}
            {showCreated && (
              <MetadataColumn $hide={hover}>
                <DateDisplay
                  color='disabled'
                  displayTime={false}
                  size={TypographySize.SMALL}
                  type='absolute'
                  value={createdAt}
                />
              </MetadataColumn>
            )}
            {showUpdated && (
              <MetadataColumn $hide={hover}>
                <DateDisplay
                  color='disabled'
                  displayTime={false}
                  size={TypographySize.SMALL}
                  type='absolute'
                  value={updatedAt}
                />
              </MetadataColumn>
            )}
          </MetadataContainer>
        </EndContainer>
        <HoverItemsContainer $hover={hover} ref={moreButtonRef}>
          {hoverItems?.map((item: IMenuItem) => {
            return (
              <IconButton
                active={active}
                icon={item?.icon || Icon.OverflowH}
                key={`hover-${item.label}`}
                onClick={item.onClick}
                tooltip={item.label}
                type={Type.SECONDARY}
                variant={FilledVariant.UNFILLED}
              />
            );
          })}
        </HoverItemsContainer>
      </MainContent>
    </RowLabel>
  );
};

export default React.memo(FileTableRow);
