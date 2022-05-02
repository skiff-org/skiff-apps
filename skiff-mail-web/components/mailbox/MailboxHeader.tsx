import { Icon, IconButton, Typography } from '@skiff-org/skiff-ui';
import Head from 'next/head';
import { useCallback } from 'react';
import { BrowserView, isMobile, MobileView } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { useRequiredCurrentUserData } from '../../apollo/currentUser';
import { useRouterLabelContext } from '../../context/RouterLabelContext';
import { useGetNumUnreadQuery } from '../../generated/graphql';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { MailboxThreadInfo } from '../../models/thread';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { skemailMobileMenuReducer } from '../../redux/reducers/mobileMenuReducer';
import { TOP_TOOLBAR } from '../shared/BottomToolbars';
import { MailboxView } from './Mailbox.types';
import { MailboxActions } from './MailboxActions/MailboxActions';

interface Props {
  threads: MailboxThreadInfo[];
  view: MailboxView;
  setView: (view: MailboxView) => void;
  setLastSelectedIndex: (index: number | null) => void;
  setSelectAll: () => void;
  setClearAll: () => void;
  onRefresh: () => void | Promise<void>;
  onClick?: () => void;
}

const HeaderButtons = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 48px;
  justify-content: space-between;
`;

const Header = styled.div`
  padding: ${isMobile ? '0px' : '8px'} 12px;
`;

const UnreadText = styled.span`
  color: var(--text-secondary);
`;

export const MailboxHeader = ({
  setLastSelectedIndex,
  threads,
  view,
  setView,
  setSelectAll,
  setClearAll,
  onRefresh,
  onClick
}: Props) => {
  const { value: label, name: labelName } = useRouterLabelContext();
  const { data } = useGetNumUnreadQuery({ variables: { label: label } });
  const numUnread = data?.unread ?? 0;
  const user = useRequiredCurrentUserData();
  const mobileMultiItemsActive = useAppSelector((state) => state.mobileDrawer.multipleItemSelector);

  const dispatch = useDispatch();

  const showMultiItemSelect = useCallback(() => {
    dispatch(skemailMobileDrawerReducer.actions.setMultipleItemSelector(true));
  }, [dispatch]);

  const hideMultiItemSelect = useCallback(() => {
    dispatch(skemailMobileDrawerReducer.actions.setMultipleItemSelector(false));
    setClearAll();
  }, [dispatch]);

  return (
    <>
      <Head>
        <title>
          {labelName} {numUnread > 0 ? `(${numUnread})` : undefined} – {user.username}
        </title>
      </Head>
      <MobileView>
        <HeaderButtons>
          {!mobileMultiItemsActive && (
            <IconButton
              icon={Icon.Backward}
              onClick={() => {
                // Set Mobile menu active to reopen it
                dispatch(skemailMobileMenuReducer.actions.openMenu(true));
              }}
              size='large'
            />
          )}
          {mobileMultiItemsActive && (
            <Typography className={TOP_TOOLBAR} color='link' level={1} onClick={hideMultiItemSelect}>
              Cancel
            </Typography>
          )}
          <Typography
            className={TOP_TOOLBAR}
            color='link'
            level={1}
            onClick={mobileMultiItemsActive ? setSelectAll : showMultiItemSelect}
          >
            {mobileMultiItemsActive ? 'Select all' : 'Edit'}
          </Typography>
        </HeaderButtons>
      </MobileView>
      <Header onClick={onClick}>
        <Typography level={0} type='heading'>
          {labelName}
          <UnreadText>{numUnread > 0 ? ` (${numUnread})` : ''}</UnreadText>
        </Typography>
        <BrowserView>
          <MailboxActions
            clearLastSelectedIndex={() => setLastSelectedIndex(null)}
            label={label}
            onRefresh={onRefresh}
            setView={setView}
            threads={threads}
            view={view}
          />
        </BrowserView>
      </Header>
    </>
  );
};
