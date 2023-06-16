import { Icon, IconText, Icons, Size, TypographyWeight } from 'nightwatch-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import useFileSortOrder, { SortMode } from '../../../../hooks/useFileSortOrder';
import Checkbox from '../../../Checkbox';

import { useMediaQuery } from '../../../../hooks';
import { FileTableAction } from './FileTable.types';
import FileTableActions from './FileTableActions';
import { FileTableFilter, FileTypeFilter } from './FileTableFilter';
import { FILE_TABLE_BREAKPOINT_1, FILE_TABLE_BREAKPOINT_2, FILE_TABLE_BREAKPOINT_3 } from './FileTableHeader.constants';

export const MetadataContainer = styled.div`
  display: flex;
  align-items: center;
  width: fit-content;
  gap: 46px;
  justify-content: space-between;

  user-select: none;
`;

export const MetadataColumn = styled.div<{ $hide?: boolean }>`
  width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: ${(props) => (props.$hide ? 0 : 1)};
`;

const MetadataColumnHeader = styled.div`
  display: flex;
`;

export const EndContainer = styled.div`
  margin-left: auto;
  display: flex;
  gap: 32px;
`;

const NameContainer = styled.div<{ $actions: boolean }>`
  display: flex;
  align-items: center;
  gap: 28px;
  width: 80px;
  min-width: 80px;
  user-select: none;
  border-right: ${(props) => (!props.$actions ? '' : '1px solid var(--border-secondary)')};
`;

const NameAndCheckbox = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ToolbarContainer = styled.div<{ $actions: boolean }>`
  display: flex;
  align-items: center;
  height: 36px;
  width: 100%;
  gap: ${(props) => (!props.$actions ? '' : '12px')};
`;

const CheckboxContainer = styled.div`
  width: 100%;
  display: ${isMobile ? 'none' : 'inline-flex'};
  padding: 12px 20px;
  box-sizing: border-box;
`;

const Spacer = styled.div`
  width: 14px;
`;

// State of selected items, affects checkbox
export enum FileTableHeaderSelectionState {
  None,
  Partial,
  All
}

interface FileTableHeaderLabel {
  label: string;
  sortMode?: SortMode;
}

interface FileTableHeaderProps {
  activeFileTypeFilter: FileTypeFilter;
  metadataHeaders: FileTableHeaderLabel[];
  setFileTypeFilter: (filter: FileTypeFilter) => void;
  actions?: FileTableAction[];
  selectionState?: FileTableHeaderSelectionState;
  hideFilter?: boolean;
  clearSelectedItems?: () => void;
  selectAllItems?: () => void;
}

/**
 * Component for rendering File Table Header section of dashboard,
 * which sits atop the File Table.
 */
const FileTableHeader: React.FC<FileTableHeaderProps> = ({
  metadataHeaders,
  activeFileTypeFilter,
  setFileTypeFilter,
  actions,
  selectionState,
  hideFilter = false,
  clearSelectedItems,
  selectAllItems
}) => {
  // media query for mobile devices

  const showFirstMetadataHeader = useMediaQuery(`(min-width:${FILE_TABLE_BREAKPOINT_1}px)`);
  const showSecondMetadataHeader = useMediaQuery(`(min-width:${FILE_TABLE_BREAKPOINT_2}px)`);
  const showThirdMetadataHeader = useMediaQuery(`(min-width:${FILE_TABLE_BREAKPOINT_3}px)`);

  // Access via index of header. If we add more than 3 headers, we'll need additional breakpoints
  const shouldShowMetadataHeader = [showFirstMetadataHeader, showSecondMetadataHeader, showThirdMetadataHeader];

  const [sortMode, setSortMode] = useFileSortOrder('mode');
  const [sortOrderAsc, setSortOrderAsc] = useFileSortOrder('order');

  // Toggle sort mode and/or order
  const toggleSort = (mode: SortMode) => {
    setSortMode(mode);
    setSortOrderAsc(!sortOrderAsc);
  };

  const sortButton = (label: string, mode?: SortMode, dataTest?: string) => {
    return (
      <MetadataColumn>
        <MetadataColumnHeader>
          <IconText
            color='disabled'
            data-test={dataTest}
            disabled={!mode}
            endIcon={
              sortMode === mode ? (
                <Icons color='disabled' icon={sortOrderAsc ? Icon.ArrowUp : Icon.ArrowDown} />
              ) : undefined
            }
            label={label}
            mono
            onClick={mode ? () => toggleSort(mode) : undefined}
            size={Size.SMALL}
            weight={TypographyWeight.REGULAR}
          />
          {sortMode !== mode && <Spacer />}
        </MetadataColumnHeader>
      </MetadataColumn>
    );
  };

  return (
    <CheckboxContainer>
      <ToolbarContainer $actions={!!actions?.length}>
        <NameAndCheckbox>
          {selectAllItems && clearSelectedItems && (
            <Checkbox
              checked={selectionState !== FileTableHeaderSelectionState.None}
              indeterminate={selectionState === FileTableHeaderSelectionState.Partial}
              onClick={() => {
                if (selectionState !== FileTableHeaderSelectionState.None) {
                  clearSelectedItems();
                } else {
                  selectAllItems();
                }
              }}
            />
          )}
          <NameContainer $actions={!!actions?.length}>
            {sortButton('Name', SortMode.Name, 'sort-files-by-name')}
          </NameContainer>
        </NameAndCheckbox>
        {!!actions?.length && <FileTableActions actions={actions} />}
        {!hideFilter && <FileTableFilter activeFilter={activeFileTypeFilter} setFilter={setFileTypeFilter} />}
        <EndContainer>
          <MetadataContainer>
            {metadataHeaders.map(
              ({ label, sortMode: headerSortMode }, index) =>
                !!shouldShowMetadataHeader[index] && sortButton(label, headerSortMode)
            )}
          </MetadataContainer>
        </EndContainer>
      </ToolbarContainer>
    </CheckboxContainer>
  );
};

export default FileTableHeader;
