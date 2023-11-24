import { useState, SetStateAction } from 'react';
import { AddressObjectWithDisplayPicture } from 'skiff-front-utils';
import { AddressObject } from 'skiff-graphql';
import { trimAndLowercase } from 'skiff-utils';

import {
  MailboxSearchFilter,
  EditableAddressSearchFilterChip,
  EditableMailboxSearchFilterType
} from '../../../utils/search/searchTypes';
import { FilterValueDropdown } from '../../Settings/Filters/Dropdowns/FilterValueDropdown';

interface EditAddressFilterDropdownProps {
  buttonRef: React.MutableRefObject<HTMLDivElement | null>;
  // contacts to populate dropdown options
  contactList: AddressObjectWithDisplayPicture[];
  //the filter being edited
  activeChip: EditableAddressSearchFilterChip;
  // control open filter editing dropdown; only one at a time
  setOpenEditFilterDropdown: (type: SetStateAction<undefined | EditableMailboxSearchFilterType>) => void;
  // update active search filters with a new filter
  addFilter: (newFilter: MailboxSearchFilter) => void;
  openEditFilterValueDropdown?: EditableMailboxSearchFilterType;
}

export const EditAddressFilterDropdown: React.FC<EditAddressFilterDropdownProps> = ({
  buttonRef,
  setOpenEditFilterDropdown,
  addFilter,
  contactList,
  activeChip,
  openEditFilterValueDropdown
}: EditAddressFilterDropdownProps) => {
  const { value, type } = activeChip;
  const defaultValue = value?.address || '';

  // the search string used to filter dropdown items
  const [inputSearch, setInputSearch] = useState(defaultValue);

  // Checks whether or not the contact is currently selected in dropdown
  const isContactOptionActive = (contact: AddressObjectWithDisplayPicture) =>
    value?.address === contact.address && value?.name === contact.name;

  // note that we support address search with non-valid addresses,
  // so merely adding the input value to the address field of the filter object is sufficient and desired
  const updateValue = (newValue: AddressObject) =>
    addFilter({ type, addressObj: { address: newValue.address, name: newValue.name } });

  const onContactSelect = (contact: AddressObjectWithDisplayPicture) => {
    const { address, name } = contact;
    updateValue({ address, name });
    setInputSearch(name ?? address);
  };

  // Submit inputted search addressObj
  const onInputSubmit = () => {
    const trimmedSearch = trimAndLowercase(inputSearch);
    if (trimmedSearch) {
      // this is the query that will be searched for when filter is applied;
      // it need not be a valid address for the purpose of search
      updateValue({ address: trimmedSearch });
      setInputSearch(trimmedSearch);
    } else {
      // close dropdown without further change if empty query submitted
      setOpenEditFilterDropdown(undefined);
    }
  };

  return (
    <FilterValueDropdown
      buttonRef={buttonRef}
      contactList={contactList}
      defaultValue={defaultValue}
      isContactOptionActive={isContactOptionActive}
      onContactSelect={onContactSelect}
      onInputSubmit={onInputSubmit}
      search={inputSearch}
      setSearch={setInputSearch}
      setShowDropdown={(open: boolean) => {
        if (open) {
          setOpenEditFilterDropdown(type);
          return;
        }
        // For To/From filters,
        // do not auto submit the search term on clicking outside of the dropdown
        // and, instead, reset to the default
        if (inputSearch !== defaultValue) setInputSearch(defaultValue);
      }}
      showDropdown={openEditFilterValueDropdown === type}
      typeIsAddress={true}
    />
  );
};
