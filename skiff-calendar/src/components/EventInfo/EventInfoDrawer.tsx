import { Drawer, useTheme } from 'skiff-front-utils';
import styled from 'styled-components';

import { DrawerTypes } from '../../redux/reducers/mobileDrawerReducer';
import { useAppSelector } from '../../utils';
import { useIosKeyboardHeight } from '../../utils/hooks/useIOSKeyboardHeight';

import { EventInfo } from './EventInfo';
import useCloseEventInfo from './useCloseEventInfo';

const EventInfoDrawerContentContainer = styled.div<{ keyboardHeight: number }>`
  min-height: 80vh;
  padding-bottom: ${({ keyboardHeight }) => keyboardHeight}px;
`;

export const EventInfoDrawer: React.FC = () => {
  const { theme } = useTheme();
  const { openDrawers } = useAppSelector((state) => state.mobileDrawer);

  const keyboardHeight = useIosKeyboardHeight('EventInfo');

  const [closeEventInfo] = useCloseEventInfo();

  // open when creating new event or editing existing event
  const showDrawer = !!openDrawers?.some(
    (drawer) => drawer === DrawerTypes.CreateEvent || drawer === DrawerTypes.EventInfo
  );

  return (
    <Drawer
      extraSpacer={false}
      forceTheme={theme}
      hideDrawer={() => void closeEventInfo()}
      maxHeight='95vh'
      show={showDrawer}
    >
      <EventInfoDrawerContentContainer keyboardHeight={keyboardHeight}>
        <EventInfo />
      </EventInfoDrawerContentContainer>
    </Drawer>
  );
};
