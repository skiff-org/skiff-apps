import { Icon, Icons, DropdownItem, DropdownItemProps, Drawer } from 'nightwatch-ui';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useTheme, DrawerOption, DrawerOptions } from 'skiff-front-utils';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { skemailMobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';

interface MoreBottomBarOption {
  icon: Icon;
  size: string;
  tooltip: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}
interface MobileOptionsDrawerProps {
  moreBottomBarOptions: { [key: string]: MoreBottomBarOption };
}

// More options drawer for mobile
export default function MobileOptionsDrawer({ moreBottomBarOptions }: MobileOptionsDrawerProps) {
  const dispatch = useDispatch();
  const showMoreOptions = useAppSelector((state) => state.mobileDrawer.showComposeMoreOptionsDrawer);
  const { theme: currentTheme } = useTheme();
  const theme = isMobile ? currentTheme : 'dark';

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
                <DropdownItem
                  active={option.active}
                  icon={<Icons icon={option.icon} themeMode={theme} />}
                  label={option.tooltip}
                  themeMode={theme}
                />
              </DrawerOption>
            );
          }) as React.ReactElement<DropdownItemProps> | React.ReactElement<DropdownItemProps>[]
        }
      </DrawerOptions>
    </Drawer>
  );
}
