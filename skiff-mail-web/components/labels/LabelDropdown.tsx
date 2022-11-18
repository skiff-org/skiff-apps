import { RefObject } from 'react';
import { UserLabelVariant } from 'skiff-graphql';
import styled from 'styled-components';

import { StyledDropdown } from './Dropdown.styles';
import LabelDropdownContent from './LabelDropdownContent';

interface LabelDropdownProps {
  open: boolean;
  buttonRef: RefObject<HTMLDivElement> | undefined;
  onClose(): void;
  threadID?: string;
  variant?: UserLabelVariant;
  currentSystemLabels: string[];
}

const LabelWrapper = styled.div`
  padding: 8px;
  box-sizing: border-box;
  width: 100%;
`;

export const LabelDropdown = ({
  open,
  onClose,
  buttonRef,
  threadID,
  variant = UserLabelVariant.Plain,
  currentSystemLabels
}: LabelDropdownProps) => {
  if (!open) {
    return null;
  }
  return (
    <StyledDropdown
      buttonRef={buttonRef}
      hasSubmenu
      portal
      setShowDropdown={(dropdownOpen) => {
        if (!dropdownOpen) {
          onClose();
        }
      }}
    >
      <LabelWrapper>
        <LabelDropdownContent
          currentSystemLabels={currentSystemLabels}
          isSubMenu
          threadID={threadID}
          variant={variant}
        />
      </LabelWrapper>
    </StyledDropdown>
  );
};
