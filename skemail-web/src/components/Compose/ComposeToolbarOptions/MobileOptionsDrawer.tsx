import { Icon, DropdownItem, DropdownItemColor, DropdownItemComponent } from 'nightwatch-ui';
import { useDispatch } from 'react-redux';
import { Drawer, DrawerOption, DrawerOptions } from 'skiff-front-utils';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { skemailMobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';

export interface MoreBottomBarOption {
  icon: Icon;
  tooltip: string;
  onClick?: () => Promise<void> | void;
  active?: boolean;
  disabled?: boolean;
  color?: DropdownItemColor;
}
interface MobileOptionsDrawerProps {
  moreBottomBarOptions: Record<string, MoreBottomBarOption>;
}

// More options drawer for mobile
export default function MobileOptionsDrawer({ moreBottomBarOptions }: MobileOptionsDrawerProps) {
  const dispatch = useDispatch();
  const showMoreOptions = useAppSelector((state) => state.mobileDrawer.showComposeMoreOptionsDrawer);

  const hideDrawer = () => {
    dispatch(skemailMobileDrawerReducer.actions.setShowComposeMoreOptionsDrawer(false));
  };
  return (
    <Drawer hideDrawer={hideDrawer} show={showMoreOptions} title='More options'>
      <DrawerOptions>
        {
          Object.values(moreBottomBarOptions).map((option) => {
            // Do not show disabled options
            if (option.disabled) return null;
            return (
              <DrawerOption key={option.tooltip} onClick={option.onClick}>
                <DropdownItem active={option.active} color={option?.color} icon={option.icon} label={option.tooltip} />
              </DrawerOption>
            );
          }) as DropdownItemComponent | DropdownItemComponent[]
        }
      </DrawerOptions>
    </Drawer>
  );
}
