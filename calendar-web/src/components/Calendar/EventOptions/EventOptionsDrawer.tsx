import { DropdownItem, DropdownItemColor, ThemeMode } from 'nightwatch-ui';
import React from 'react';
import { Drawer, DrawerOption, DrawerOptions } from 'skiff-front-utils';

interface EventOptionsDrawerProps {
  isOpen: boolean;
  options: {
    key: string;
    label: string;
    onClick: (e: React.MouseEvent) => Promise<void> | void;
    color: DropdownItemColor;
  }[];
  onClose: () => void;
}

export const EventOptionsDrawer: React.FC<EventOptionsDrawerProps> = ({
  isOpen,
  options,
  onClose
}: EventOptionsDrawerProps) => {
  return (
    <Drawer forceTheme={ThemeMode.DARK} formatTitle={false} hideDrawer={onClose} show={isOpen} title='Event options'>
      <DrawerOptions>
        {options.map(({ key, label, onClick, color }) => (
          <DrawerOption key={key} onClick={(e: React.MouseEvent) => void onClick(e)}>
            <DropdownItem color={color} key={label} label={label} />
          </DrawerOption>
        ))}
      </DrawerOptions>
    </Drawer>
  );
};
