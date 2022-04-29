import { Drawer, DropdownItem, Icon, IconText } from '@skiff-org/skiff-ui';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { skemailMobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { DrawerOption, DrawerOptions } from '../../shared/DrawerOptions';

const Title = styled.div`
  display: flex;
  text-align: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-secondary);
`;

export default function MobileSettingsDrawer() {
  const dispatch = useDispatch();
  const show = useAppSelector((state) => state.mobileDrawer.showSettingsDrawer);

  const showLogoutModal = useCallback(() => {
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.Logout }));
  }, [dispatch]);

  const hideDrawer = useCallback(() => {
    dispatch(skemailMobileDrawerReducer.actions.setShowSettingsDrawer(false));
  }, [dispatch]);

  return (
    <Drawer hideDrawer={hideDrawer} show={show}>
      <Title>
        <IconText label='Settings' startIcon={Icon.Settings} />
      </Title>
      <DrawerOptions>
        <DrawerOption onClick={showLogoutModal}>
          <DropdownItem icon={Icon.Exit} label='Logout' />
        </DrawerOption>
      </DrawerOptions>
    </Drawer>
  );
}
