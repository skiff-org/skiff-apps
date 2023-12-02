import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { ThemeMode } from '../../types';
import Dropdown, { SUBMENU_CONTAINER_CLASS } from '../Dropdown';
import DropdownItem, { DROPDOWN_ITEM_ICON_CSS } from '../DropdownItem';
import Icons, { Icon } from '../Icons';

import { DropdownSubmenuProps } from './DropdownSubmenu.types';

const DropdownItemContainer = styled.div`
  width: 100%;
`;

const SubmenuContainer = styled.div`
  z-index: 999;
`;

const IconContainer = styled.div`
  ${DROPDOWN_ITEM_ICON_CSS}
`;

export default function DropdownSubmenu({ label, children, icon, ...dropdownProps }: DropdownSubmenuProps) {
  // Controls whether or not to show to submenu
  const [showDropdown, setShowDropdownSubmenu] = useState(false);
  // Whether or not the dropdown item is hovered over
  const [isHoveringItem, setIsHoveringItem] = useState(false);
  // Whether or not the submenu is hovered over
  const [isHoveringSubmenu, setIsHoveringSubmenu] = useState(false);

  // Whether the dropdown item or the submenu is hovered over
  const isHovering = isHoveringItem || isHoveringSubmenu;
  // Dropdown item ref
  const submenuButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHovering) {
      setShowDropdownSubmenu(true);
    } else {
      setShowDropdownSubmenu(false);
    }
  }, [isHovering]);

  return (
    <>
      {/* The dropdown item that triggers opening the submenu */}
      <DropdownItemContainer onMouseEnter={() => setIsHoveringItem(true)} onMouseLeave={() => setIsHoveringItem(false)}>
        <DropdownItem
          endElement={
            <IconContainer $hovering={isHovering}>
              <Icons icon={Icon.ChevronRight} forceTheme={ThemeMode.DARK} />
            </IconContainer>
          }
          highlight={isHovering}
          icon={icon}
          label={label}
          onClick={() => setShowDropdownSubmenu(!showDropdown)}
          ref={submenuButtonRef}
        />
      </DropdownItemContainer>
      <SubmenuContainer
        onMouseEnter={() => setIsHoveringSubmenu(true)}
        onMouseLeave={() => setIsHoveringSubmenu(false)}
      >
        <Dropdown
          setShowDropdown={setShowDropdownSubmenu}
          showDropdown={showDropdown}
          buttonRef={submenuButtonRef}
          className={SUBMENU_CONTAINER_CLASS}
          isSubmenu
          portal
          {...dropdownProps}
        >
          {children}
        </Dropdown>
      </SubmenuContainer>
    </>
  );
}
