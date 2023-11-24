import { DropdownItem, ThemeMode } from 'nightwatch-ui';
import { Drawer, DrawerOptions, DrawerOption } from 'skiff-front-utils';

import { DrawerTypes } from '../../redux/reducers/mobileDrawerReducer';
import { useMobileDrawer } from '../../utils/hooks/useMobileDrawer';

import { ParticipantRowAction } from './ParticipantsSuggestions.types';

interface MobileParticipantActionsDrawerProps {
  drawerTitle: string;
  actions?: ParticipantRowAction[];
}
export default function MobileParticipantActionsDrawer({
  actions = [],
  drawerTitle
}: MobileParticipantActionsDrawerProps) {
  const { isOpen: showActionsDrawer, closeDrawer: hideParticipantActionsDrawer } = useMobileDrawer(
    DrawerTypes.ParticipantActions
  );

  return (
    <Drawer
      forceTheme={ThemeMode.DARK}
      formatTitle={false}
      hideDrawer={hideParticipantActionsDrawer}
      show={!!showActionsDrawer}
      title={drawerTitle}
    >
      <DrawerOptions>
        {actions.map(({ label, onClick, alert, key }) => (
          <DrawerOption key={key} onClick={onClick}>
            <DropdownItem color={alert ? 'destructive' : undefined} key={label} label={label} />
          </DrawerOption>
        ))}
      </DrawerOptions>
    </Drawer>
  );
}
