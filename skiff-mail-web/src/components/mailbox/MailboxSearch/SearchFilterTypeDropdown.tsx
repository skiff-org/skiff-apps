import partition from 'lodash/partition';
import { Dropdown, DropdownItem, Divider, ThemeMode } from 'nightwatch-ui';
import styled from 'styled-components';

import { MailboxSearchFilterType } from '../../../utils/search/searchTypes';
import { isMetadataFilterType } from '../../../utils/search/searchUtils';
import { DROPDOWN_ANCHOR_GAP } from '../../Settings/Filters/Filters.constants';

import { getSearchFilterTypeLabel } from './MailboxSearch.utils';

const DividerWrapper = styled.div`
  width: calc(100% + 8px);
  /* override dropdown padding for divider */
  margin: 4px -4px;
`;

interface SearchFilterTypeDropdownProps {
  inUseFilterTypes: MailboxSearchFilterType[];
  buttonRef: React.MutableRefObject<HTMLDivElement | null>;
  showDropdown: boolean;
  setShowDropdown: (state: boolean) => void;
  onClickFilterType: (type: MailboxSearchFilterType) => void;
}

export const SearchFilterTypeDropdown: React.FC<SearchFilterTypeDropdownProps> = ({
  buttonRef,
  inUseFilterTypes,
  showDropdown,
  setShowDropdown,
  onClickFilterType
}: SearchFilterTypeDropdownProps) => {
  const types = Object.values(MailboxSearchFilterType);
  const [metadataTypes, emailContentTypes] = partition(types, isMetadataFilterType);

  const onSelectType = (type: MailboxSearchFilterType) => {
    onClickFilterType(type);
    setShowDropdown(false);
  };

  const isTypeDisabled = (type: MailboxSearchFilterType) => {
    if (inUseFilterTypes.includes(type)) return true;
    // only one of folder or system label filters can be applied concurrently;
    // this is a rule of thumb that's not applicable in all cases --
    // for example, 'SENT' is not actually mutually exclusive with user folders;
    // but we enforce this blanket exclusion at the moment; it's simpler to enforce (and for the user to understand)
    // mutual exclusions at the category level than the value level, and combining folder and system label filters
    // is not expected to be high-need
    if (type === MailboxSearchFilterType.SYSTEM_LABEL) {
      return inUseFilterTypes.includes(MailboxSearchFilterType.USER_FOLDER_LABEL);
    }
    if (type === MailboxSearchFilterType.USER_FOLDER_LABEL) {
      return inUseFilterTypes.includes(MailboxSearchFilterType.SYSTEM_LABEL);
    }
    return false;
  };

  return (
    <Dropdown
      buttonRef={buttonRef}
      gapFromAnchor={DROPDOWN_ANCHOR_GAP}
      portal
      setShowDropdown={setShowDropdown}
      showDropdown={showDropdown}
    >
      {emailContentTypes.map((type) => (
        <DropdownItem
          disabled={isTypeDisabled(type)}
          key={type}
          label={getSearchFilterTypeLabel(type)}
          onClick={() => onSelectType(type)}
          value={type}
        />
      ))}
      <DividerWrapper>
        <Divider forceTheme={ThemeMode.DARK} />
      </DividerWrapper>
      {metadataTypes.map((type) => (
        <DropdownItem
          disabled={isTypeDisabled(type)}
          key={type}
          label={getSearchFilterTypeLabel(type)}
          onClick={() => onSelectType(type)}
          value={type}
        />
      ))}
    </Dropdown>
  );
};
