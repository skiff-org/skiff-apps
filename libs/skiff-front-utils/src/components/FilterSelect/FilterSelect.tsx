import {
  DISPLAY_SCROLLBAR_CSS,
  Divider,
  Dropdown,
  DropdownItem,
  Icon,
  Icons,
  InputField,
  ThemeMode
} from 'nightwatch-ui';
import React, { RefObject, useEffect, useState } from 'react';
import styled from 'styled-components';

import { simpleSubStringSearchFilter, sortAlphabetically } from '../../utils';

import { FilterSelectMetadataItem } from './FilterSelectMetadataItem';

export const FILTER_DROPDOWN_WIDTH = 260;

const Container = styled.div`
  width: 100%;
`;

const DividerContainer = styled.div`
  padding-top: 8px;
`;

const ScrollContainer = styled.div<{ $themeMode: ThemeMode }>`
  max-height: 180px;
  overflow-y: auto;
  ${DISPLAY_SCROLLBAR_CSS}
`;

interface FilterSelectProps {
  open: boolean;
  buttonRef: RefObject<HTMLDivElement> | undefined;
  filterLabels: string[];
  onClose(): void;
  isFilterActive: (filter: string) => boolean;
  onSelectFilter: (filter: string) => void;
  clearAllFilters: () => void;
  numActiveFilters?: number;
  minWidth?: number | string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  open,
  buttonRef,
  filterLabels,
  onClose,
  onSelectFilter,
  isFilterActive,
  clearAllFilters,
  numActiveFilters,
  minWidth
}: FilterSelectProps) => {
  // Current hovered dropdown item
  const [highlightedIdx, setHighlightedIdx] = useState<number>(0);
  // Search field value
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) {
      setSearch('');
      setHighlightedIdx(0);
    }
  }, [open]);

  const setShowDropdown = (dropdownOpen: boolean) => {
    if (!dropdownOpen) {
      onClose();
    }
  };

  const filteredFilters = sortAlphabetically(simpleSubStringSearchFilter(filterLabels, search));

  return (
    <Dropdown
      buttonRef={buttonRef}
      inputField={<InputField onChange={(e) => setSearch(e.target.value)} value={search} />}
      keyboardNavControls={{
        idx: highlightedIdx,
        setIdx: setHighlightedIdx,
        numItems: filteredFilters.length
      }}
      portal
      setShowDropdown={setShowDropdown}
      showDropdown={open}
      width={FILTER_DROPDOWN_WIDTH}
      minWidth={minWidth}
    >
      <Container>
        {filteredFilters.length > 0 && (
          <ScrollContainer $themeMode={ThemeMode.DARK}>
            {filteredFilters.map((filter, index) => {
              // If 'highlightedIdx' is undefined, that means keyboard navigation is inactive
              // and in order to reflect that in the DropdownItem, we need to pass undefined to the 'highlight' prop
              const isHighlighted = highlightedIdx !== undefined ? index === highlightedIdx : undefined;
              const onHover = () => setHighlightedIdx(index);
              const isActive = isFilterActive(filter);
              const toggleFilterSelect = () => onSelectFilter(filter);
              return (
                <DropdownItem
                  highlight={isHighlighted}
                  key={filter}
                  label={filter}
                  onClick={toggleFilterSelect}
                  onHover={onHover}
                  startElement={
                    isActive ? (
                      <Icons color='link' forceTheme={ThemeMode.DARK} icon={Icon.CheckboxFilled} />
                    ) : (
                      <Icons color='secondary' forceTheme={ThemeMode.DARK} icon={Icon.CheckboxEmpty} />
                    )
                  }
                />
              );
            })}
          </ScrollContainer>
        )}
        {!!numActiveFilters && (
          <>
            <DividerContainer>
              <Divider forceTheme={ThemeMode.DARK} width={248} />
            </DividerContainer>
            <FilterSelectMetadataItem
              clearAllFilters={() => {
                clearAllFilters();
                onClose();
              }}
              numActiveFilters={numActiveFilters}
            />
          </>
        )}
      </Container>
    </Dropdown>
  );
};
