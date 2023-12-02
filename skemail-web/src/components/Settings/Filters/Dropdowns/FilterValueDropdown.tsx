import {
  DISPLAY_SCROLLBAR_CSS,
  Dropdown,
  DropdownItem,
  Icon,
  InputField,
  ThemeMode,
  getThemedColor
} from 'nightwatch-ui';
import { useMemo, useState, useEffect } from 'react';
import { AddressObjectWithDisplayPicture, ContactsDropdownItems } from 'skiff-front-utils';
import { trimAndLowercase } from 'skiff-utils';
import styled from 'styled-components';

import { DROPDOWN_ANCHOR_GAP } from '../Filters.constants';
import { ConditionValue } from '../Filters.types';

const ScrollContainer = styled.div<{ $themeMode: ThemeMode }>`
  overflow-y: auto;
  max-height: 200px;
  width: 100%;
  ${DISPLAY_SCROLLBAR_CSS}
`;

const SearchContainer = styled.div<{ $showBorder: boolean }>`
  width: 100%;

  // only add the padding-top and margin-top when there is a border
  ${({ $showBorder }) =>
    $showBorder &&
    `
        padding-top: 4px;
        margin-top: 4px;
        box-sizing: border-box;
        border-top: 1px solid ${getThemedColor('var(--border-tertiary)', ThemeMode.DARK)};
    `}

  * {
    overflow: hidden;
    max-width: 320px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

interface FilterValueDropdownProps {
  buttonRef: React.MutableRefObject<HTMLDivElement | null>;
  showDropdown: boolean;
  /** Whether or not we're filtering To/From addresses */
  typeIsAddress: boolean;
  search: string;
  defaultValue: string;
  setSearch: (search: string) => void;
  isContactOptionActive: (contact: AddressObjectWithDisplayPicture, label: string) => boolean;
  setShowDropdown: (open: boolean) => void;
  onContactSelect: (contact: AddressObjectWithDisplayPicture) => void;
  onInputSubmit: () => void;
  contactList?: AddressObjectWithDisplayPicture[];
  value?: ConditionValue;
}

export const FilterValueDropdown: React.FC<FilterValueDropdownProps> = ({
  buttonRef,
  showDropdown,
  typeIsAddress,
  value,
  defaultValue,
  contactList,
  search,
  onContactSelect,
  onInputSubmit,
  isContactOptionActive,
  setSearch,
  setShowDropdown
}: FilterValueDropdownProps) => {
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  const filteredContacts = useMemo(() => {
    if (!search) return contactList;
    const searchTerm = trimAndLowercase(search);
    // Search through both the display names and addresses
    return contactList?.filter(
      (item) =>
        trimAndLowercase(item.name || '').includes(searchTerm) || trimAndLowercase(item.address).includes(searchTerm)
    );
  }, [contactList, search]);
  // Whether or not the full address in the search bar exists in the contacts
  const contactsContainsSearch = filteredContacts?.some((contact) => contact.address === search);
  // Only include the search term as a dropdown item for the address (TO/FROM) types
  const showAddAddress = search && !contactsContainsSearch && typeIsAddress;
  // Total number of dropdown items
  const numDropdownItems = (filteredContacts?.length || 0) + (showAddAddress ? 1 : 0);

  const onInputEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onInputSubmit();
    }
  };

  // when the search input changes, highlight it for the user
  // so that 'Enter' key press applies to the free input string
  useEffect(() => {
    if (showAddAddress && search && !!numDropdownItems) {
      setHighlightedIndex(numDropdownItems - 1);
    }
  }, [showAddAddress, search, numDropdownItems]);

  return (
    <Dropdown
      buttonRef={buttonRef}
      gapFromAnchor={DROPDOWN_ANCHOR_GAP}
      inputField={
        <InputField
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={onInputEnter}
          placeholder={typeIsAddress ? 'Filter emails...' : ''}
          value={search}
        />
      }
      keyboardNavControls={{
        idx: highlightedIndex,
        setIdx: setHighlightedIndex,
        numItems: numDropdownItems
      }}
      maxWidth={330}
      minWidth={220}
      portal
      setShowDropdown={(open: boolean) => {
        setShowDropdown(open);
        if (open) return;
        // Reset / submit the search value on closing the dropdown by clicking outside
        if (typeIsAddress) {
          // For To/From address condition types,
          // do not auto submit the search term on clicking outside of the dropdown
          // and, instead, reset to the default
          if (search !== defaultValue) setSearch(defaultValue);
        } else {
          // Otherwise, for options without suggestions, submit the inputted value
          onInputSubmit();
        }
      }}
      showDropdown={showDropdown}
    >
      {/** For To/From address conditions */}
      {typeIsAddress && !!filteredContacts?.length && (
        <ScrollContainer $themeMode={ThemeMode.DARK}>
          <ContactsDropdownItems
            contactOptions={filteredContacts}
            highlightedIdx={highlightedIndex}
            isOptionActive={isContactOptionActive}
            onClick={(contact) => onContactSelect(contact)}
            setHighlightedIdx={setHighlightedIndex}
            theme={ThemeMode.DARK}
          />
        </ScrollContainer>
      )}
      {showAddAddress && (
        <SearchContainer $showBorder={!!filteredContacts?.length}>
          <DropdownItem
            active={value === search}
            highlight={highlightedIndex === numDropdownItems - 1}
            icon={Icon.Plus}
            label={`"${search}"`}
            onClick={onInputSubmit}
            onHover={() => setHighlightedIndex(numDropdownItems - 1)}
          />
        </SearchContainer>
      )}
    </Dropdown>
  );
};
