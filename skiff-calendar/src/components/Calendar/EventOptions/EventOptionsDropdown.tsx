import { Dropdown, DropdownItem, DropdownItemColor, MouseEvents } from 'nightwatch-ui';
import React, { RefObject } from 'react';

import { EVENT_OPTIONS_DROPDOWN_CLASSNAME } from '../../../constants/calendar.constants';

export interface OptionsDropdownTargetInfo {
  x: number;
  y: number;
  isOpen: boolean;
}

export type AnchorLeftTop = Pick<OptionsDropdownTargetInfo, 'x' | 'y'>;
export type AnchorRef = RefObject<HTMLDivElement>;

interface EventOptionsDropdownProps {
  dropdownAnchor?: AnchorLeftTop;
  dropdownBtnRef: AnchorRef;
  isOpen: boolean;
  options: {
    key: string;
    label: string;
    onClick: () => Promise<void> | void;
    color: DropdownItemColor;
  }[];
  onClose: () => void;
}

export const EventOptionsDropdown: React.FC<EventOptionsDropdownProps> = ({
  dropdownAnchor,
  dropdownBtnRef,
  isOpen,
  options,
  onClose
}: EventOptionsDropdownProps) => {
  return (
    <Dropdown
      buttonRef={dropdownBtnRef}
      className={EVENT_OPTIONS_DROPDOWN_CLASSNAME}
      //  Since DragToCreate listens to mousedown we have to change the clicking outside to listen to onclick
      clickOutsideWebListener={MouseEvents.CLICK}
      customAnchor={dropdownAnchor}
      portal
      setShowDropdown={(target) => {
        if (!target) onClose();
      }}
      showDropdown={isOpen}
    >
      {options.map(({ key, label, onClick, color }) => (
        <DropdownItem color={color} key={key} label={label} onClick={onClick} />
      ))}
    </Dropdown>
  );
};
