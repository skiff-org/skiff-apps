import { Drawer, DropdownItem, DropdownItemProps } from '@skiff-org/skiff-ui';

import { DrawerOption, DrawerOptions } from '../../shared/DrawerOptions';
import { MoreBottomBarOption } from './MoreBottomBarOptions';

interface MobileOptionsDrawerProps {
  showMoreOptions: boolean;
  setShowMoreOptions: (value: boolean) => void;
  moreBottomBarOptions: { [key: string]: MoreBottomBarOption };
}

// More options drawer for mobile
export default function MobileOptionsDrawer({
  showMoreOptions,
  setShowMoreOptions,
  moreBottomBarOptions
}: MobileOptionsDrawerProps) {
  const hideDrawer = () => {
    setShowMoreOptions(false);
  };
  return (
    <Drawer hideDrawer={hideDrawer} show={showMoreOptions} title='More options'>
      <DrawerOptions>
        {
          Object.values(moreBottomBarOptions).map((option) => {
            // Do not show disabled options
            if (option.disabled) return null;
            return (
              <DrawerOption key={option.tooltip}>
                <DropdownItem
                  active={option.active}
                  icon={option.icon}
                  label={option.tooltip}
                  onClick={option.onClick}
                />
              </DrawerOption>
            );
          }) as React.ReactElement<DropdownItemProps> | React.ReactElement<DropdownItemProps>[]
        }
      </DrawerOptions>
    </Drawer>
  );
}
