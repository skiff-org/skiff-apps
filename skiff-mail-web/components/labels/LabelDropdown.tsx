import { RefObject } from 'react';

import { StyledDropdown } from './Dropdown.styles';
import LabelDropdownContent from './LabelDropdownContent';

interface LabelDropdownProps {
  open: boolean;
  buttonRef: RefObject<HTMLDivElement> | undefined;
  onClose(): void;
}

export const LabelDropdown = ({ open, onClose, buttonRef }: LabelDropdownProps) => {
  if (!open) {
    return null;
  }
  return (
    <StyledDropdown
      buttonRef={buttonRef}
      setShowDropdown={(dropdownOpen) => {
        if (!dropdownOpen) {
          onClose();
        }
      }}
    >
      <LabelDropdownContent />
    </StyledDropdown>
  );
};
