import { Dropdown, DropdownItem, Icon } from 'nightwatch-ui';
import { RefObject } from 'react';

interface ManageCustomDomainDropdownProps {
  buttonRef: RefObject<HTMLDivElement>;
  showDropdown: boolean;
  setShowDropdown: (value: boolean) => void;
  showRecords: () => void;
  showDeleteDomain: () => void;
  showDefaultAlias: () => void;
  showDefaultOption: boolean;
}

const ManageCustomDomainDropdown: React.FC<ManageCustomDomainDropdownProps> = ({
  buttonRef,
  showDropdown,
  setShowDropdown,
  showRecords,
  showDeleteDomain,
  showDefaultAlias,
  showDefaultOption
}: ManageCustomDomainDropdownProps) => {
  return (
    <Dropdown buttonRef={buttonRef} portal setShowDropdown={setShowDropdown} showDropdown={showDropdown}>
      <DropdownItem
        icon={Icon.Book}
        label='View records'
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          showRecords();
          setShowDropdown(false);
        }}
      />
      {showDefaultOption && (
        <DropdownItem
          icon={Icon.Star}
          label='Set default'
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            showDefaultAlias();
            setShowDropdown(false);
          }}
        />
      )}
      <DropdownItem
        icon={Icon.Trash}
        label='Delete'
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          showDeleteDomain();
          setShowDropdown(false);
        }}
      />
    </Dropdown>
  );
};

export default ManageCustomDomainDropdown;
