import { Drawer, DropdownItem, Icon, IconText } from '@skiff-org/skiff-ui';
import { Dispatch, SetStateAction, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { skemailMobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';
import { DrawerOption, DrawerOptions } from '../../shared/DrawerOptions';
import { MailboxView } from '../Mailbox.types';

const Title = styled.div`
  display: flex;
  text-align: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-secondary);
`;

interface MobileFilterDrawerProps {
  view: MailboxView;
  setView: Dispatch<SetStateAction<MailboxView>>;
}

export default function MobileFilterDrawer({ view, setView }: MobileFilterDrawerProps) {
  const dispatch = useDispatch();
  const show = useAppSelector((state) => state.mobileDrawer.showFilterDrawer);

  const hideDrawer = useCallback(() => {
    dispatch(skemailMobileDrawerReducer.actions.setShowFilterDrawer(false));
  }, [dispatch]);

  return (
    <Drawer hideDrawer={hideDrawer} show={show}>
      <Title>
        <IconText label='Filter messages' startIcon={Icon.Filter} />
      </Title>
      <DrawerOptions>
        <DrawerOption onClick={() => setView(MailboxView.ALL)}>
          <DropdownItem active={view === MailboxView.ALL} label='All' />
        </DrawerOption>
        <DrawerOption onClick={() => setView(MailboxView.READ)}>
          <DropdownItem active={view === MailboxView.READ} label='Read' />
        </DrawerOption>
        <DrawerOption onClick={() => setView(MailboxView.UNREAD)}>
          <DropdownItem active={view === MailboxView.UNREAD} label='Unread' />
        </DrawerOption>
      </DrawerOptions>
    </Drawer>
  );
}
