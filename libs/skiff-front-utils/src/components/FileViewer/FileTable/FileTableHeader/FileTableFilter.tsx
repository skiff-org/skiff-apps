import { Dropdown, DropdownItem, Icon, IconText, TypographyWeight } from '@skiff-org/skiff-ui';
import React, { useRef, useState } from 'react';
import { upperCaseFirstLetter } from 'skiff-utils';
import styled from 'styled-components';

import { FileTypes, getIconFromMIMEType, MIMETypes } from '../../../../utils/fileUtils';

const FilterButton = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 8px;
  border-radius: 6px;
  &:hover {
    cursor: pointer;
    background-color: var(--bg-cell-hover);
  }
`;
/**
 * FileTableFilter
 *
 * Component for filter the file table by generic file type
 *
 */

// reduced set of generic file types for filtering the file table
export enum FileTypeFilter {
  All = 'All',
  Page = 'Page',
  Image = 'Image',
  Zip = 'Zip',
  Video = 'Video',
  Sound = 'Sound',
  Sheet = 'Sheet',
  Pdf = 'Pdf'
}

interface FileTableFilterProps {
  activeFilter: FileTypeFilter;
  setFilter: (fileType: FileTypeFilter) => void;
}

export const FileTableFilter: React.FC<FileTableFilterProps> = ({ activeFilter, setFilter }) => {
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const [showFilterSelect, setShowFilterSelect] = useState(false);

  const getFilterIcon = (filter: FileTypeFilter): Icon => {
    if (MIMETypes[filter as unknown as FileTypes]) {
      return getIconFromMIMEType(MIMETypes[filter as unknown as FileTypes][0]);
    } else if (filter === FileTypeFilter.All) {
      return Icon.Filter;
    } else {
      return Icon.File;
    }
  };

  return (
    <>
      <FilterButton onClick={() => setShowFilterSelect((prev) => !prev)} ref={filterButtonRef}>
        <IconText
          color='secondary'
          endIcon={Icon.ChevronDown}
          label={activeFilter}
          startIcon={getFilterIcon(activeFilter)}
          weight={TypographyWeight.REGULAR}
        />
      </FilterButton>
      <Dropdown
        buttonRef={filterButtonRef}
        portal
        setShowDropdown={setShowFilterSelect}
        showDropdown={showFilterSelect}
      >
        {Object.values(FileTypeFilter)
          .sort()
          .map((filterValue) => (
            <DropdownItem
              icon={getFilterIcon(filterValue)}
              key={filterValue}
              label={upperCaseFirstLetter(filterValue)}
              onClick={() => {
                setFilter(filterValue as FileTypeFilter);
                setShowFilterSelect(false);
              }}
              value={upperCaseFirstLetter(filterValue)}
            />
          ))}
      </Dropdown>
    </>
  );
};
