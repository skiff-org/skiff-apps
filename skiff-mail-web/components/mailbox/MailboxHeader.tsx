import Head from 'next/head';
import { Icon, IconButton, Icons, Typography } from 'nightwatch-ui';
import React, { useCallback, useEffect, useState } from 'react';
import { BrowserView, isMobile, MobileView } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { DEFAULT_MOBILE_SETTINGS_INDICES, MobileSearch } from 'skiff-front-utils';
import { sendRNWebviewMsg } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import { useGetNumUnreadQuery } from 'skiff-mail-graphql';
import { POLL_INTERVAL_IN_MS } from 'skiff-utils';
import styled from 'styled-components';

import { useRequiredCurrentUserData } from '../../apollo/currentUser';
import { useRouterLabelContext } from '../../context/RouterLabelContext';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useCurrentUserEmailAliases } from '../../hooks/useCurrentUserEmailAliases';
import { MailboxThreadInfo } from '../../models/thread';
import { skemailMailboxReducer } from '../../redux/reducers/mailboxReducer';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { useSettings } from '../Settings/useSettings';

import { MailboxActions } from './MailboxActions/MailboxActions';

interface MailboxHeaderProps {
  showSkeleton: boolean;
  setMobileSearchQuery: (s: string) => void;
  threads: MailboxThreadInfo[];
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
  ${isMobile && '-webkit-user-select: none;'}
  ${isMobile && 'padding: 0px 12px;'}
`;

const Header = styled.div`
  padding: ${isMobile ? '0px 12px' : '12px 20px'};
  user-select: none;
  border-bottom: ${isMobile ? undefined : `1px solid var(--border-tertiary)`};
  ${isMobile && '-webkit-user-select: none;'}
`;

const UnreadText = styled.span`
  color: var(--text-link);
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
`;

const UnreadLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TitleSearch = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const MailBoxSelector = styled.div`
  padding: 6px 4px;
  border-radius: 32px;
  margin-bottom: 8px;
  transition: background 0.2s;
  &:active {
    background: var(--bg-cell-active);
    transition: background 0s;
  }
`;

const MailBoxLabel = styled(Typography)`
  font-size: 28px !important;
  line-height: 36px !important;
`;

export const MAIL_LIST_HEADER_ID = 'mailListHeader';
export const MOBILE_HEADER_HEIGHT = 160;

let mailListHeaderElement;
const setMailListElementCache = () => {
  mailListHeaderElement = document.getElementById(MAIL_LIST_HEADER_ID);
};

export const animateMailListHeader = (progress: string, transition?: string) => {
  if (!mailListHeaderElement || !mailListHeaderElement.isConnected) {
    setMailListElementCache();
  }
  mailListHeaderElement.style.transform = `translateY(calc((1 - ${progress}) * -${MOBILE_HEADER_HEIGHT}px))`;
  mailListHeaderElement.style.opacity = progress;
  if (transition) {
    mailListHeaderElement.style.transition = `transform ${transition}, opacity ${transition}`;
  }
};

const MobileHeaderContainer = styled.div<{ showSkeleton: boolean }>`
  position: absolute;
  top: 0px;
  z-index: 1;
  box-sizing: border-box;
  height: ${(props) => (props.showSkeleton ? '12' : MOBILE_HEADER_HEIGHT)}px;
  background: var(--bg-l1-solid);
  width: 100%;
`;

const MultiItemsButton = styled(Typography)`
  margin-right: 16px;
`;

const MailboxActionBar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
`;

const HeaderLabels = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 48px;
  justify-content: space-between;
  ${isMobile && '-webkit-user-select: none;'}
  ${isMobile && 'padding: 0px 12px 0px 16px;'}
`;

export const MailboxHeader = ({
  showSkeleton,
  threads,
  setSelectAll,
  setClearAll,
  onRefresh,
  onClick,
  setMobileSearchQuery
}: MailboxHeaderProps) => {
  const { value: label, name: labelName } = useRouterLabelContext();
  const { data, refetch: updateNumUnread } = useGetNumUnreadQuery({
    variables: { label },
    skip: label === SystemLabels.Sent || label === SystemLabels.Drafts,
    pollInterval: POLL_INTERVAL_IN_MS
  });
  const { openSettings } = useSettings();

  // make sure any changes to visible threads will trigger update of number unread
  useEffect(() => {
    updateNumUnread();
  }, [threads]);

  const numUnread = data?.unread ?? 0;
  const user = useRequiredCurrentUserData();
  const mobileMultiItemsActive = useAppSelector((state) => state.mobileDrawer.multipleItemSelector);
  const [shouldSelectAll, setShouldSelectAll] = useState(true);

  const dispatch = useDispatch();

  const setLastSelectedIndex = useCallback(
    (index: number | null) => {
      dispatch(skemailMailboxReducer.actions.setLastSelctedIndex(index));
    },
    [dispatch]
  );

  const showMultiItemSelect = useCallback(() => {
    dispatch(skemailMobileDrawerReducer.actions.setMultipleItemSelector(true));
  }, [dispatch]);

  const hideMultiItemSelect = useCallback(() => {
    dispatch(skemailMobileDrawerReducer.actions.setMultipleItemSelector(false));
    setClearAll();
  }, [dispatch, setClearAll]);

  const setSelectedThreadIDs = useCallback(
    (selectedThreadIDs: string[]) =>
      dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs })),
    [dispatch]
  );

  const showSettingsDrawer = useCallback(
    (e: React.MouseEvent) => {
      e?.stopPropagation();
      openSettings(DEFAULT_MOBILE_SETTINGS_INDICES);
    },
    [openSettings]
  );
  const showFilterDrawer = useCallback(
    (e: React.MouseEvent) => {
      e?.stopPropagation();
      dispatch(skemailMobileDrawerReducer.actions.setShowFilterDrawer(true));
    },
    [dispatch]
  );

  const onClickEdit = () => {
    setShouldSelectAll(true);
    showMultiItemSelect();
  };

  const onSelectAll = () => {
    setSelectAll();
    setShouldSelectAll(false);
  };

  const onSelectNone = () => {
    setClearAll();
    setShouldSelectAll(true);
  };

  const onMailboxSelectorClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
    dispatch(skemailMobileDrawerReducer.actions.setShowMailboxSelectDrawer(true));
  };

  const onCancelClick = (e: React.MouseEvent<Element, MouseEvent>) => {
    e.stopPropagation();
    hideMultiItemSelect();
  };

  const onRightItemClick = (e: React.MouseEvent<Element, MouseEvent>) => {
    e.stopPropagation();
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    mobileMultiItemsActive ? (shouldSelectAll ? onSelectAll() : onSelectNone()) : onClickEdit();
  };

  const inboxIsEmpty = threads.length === 0;

  const aliases = useCurrentUserEmailAliases();

  const openCommandPalette = () =>
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.CommandPalette }));

  useEffect(() => {
    if (inboxIsEmpty && mobileMultiItemsActive) {
      hideMultiItemSelect();
    }
    // Close mult select on unmount
    return () => {
      if (mobileMultiItemsActive) {
        hideMultiItemSelect();
      }
    };
  }, [mobileMultiItemsActive]);

  const headTitle = (
    <Head>
      <title>
        {labelName} {numUnread > 0 ? `(${numUnread.toLocaleString()})` : undefined} - {aliases?.[0] ?? user.username}
      </title>
    </Head>
  );

  useEffect(() => {
    // Communicate with react-native and update about unread mail count (for updating iOS badge)
    // If we are on mobile app, send unread count to react-native
    sendRNWebviewMsg('unreadMailCount', { numUnread });
  }, [numUnread]);
  const getEditButtonName = () => {
    if (inboxIsEmpty) return null;

    if (!mobileMultiItemsActive) return 'Edit';

    if (shouldSelectAll) return ' Select all';

    return 'Select none';
  };
  return (
    <>
      <MobileView style={{ position: 'relative' }}>
        <MobileHeaderContainer id={MAIL_LIST_HEADER_ID} showSkeleton={showSkeleton}>
          <HeaderLabels onClick={onClick}>
            {!inboxIsEmpty && mobileMultiItemsActive && (
              <Typography color='link' level={1} onClick={onCancelClick} type='label'>
                Cancel
              </Typography>
            )}
            <MultiItemsButton color='link' level={1} onClick={onRightItemClick} type='label'>
              {/* Don't show edit button when inbox is empty */}
              {getEditButtonName()}
            </MultiItemsButton>
            {!mobileMultiItemsActive && (
              <MailboxActionBar>
                <IconButton color='secondary' icon={Icon.Filter} onClick={showFilterDrawer} size='large' />
                <IconButton
                  color='secondary'
                  dataTest='mobile-settings-button'
                  icon={Icon.Settings}
                  onClick={showSettingsDrawer}
                  size='large'
                />
              </MailboxActionBar>
            )}
          </HeaderLabels>
          {headTitle}
          <HeaderButtons onClick={onClick}>
            <MailBoxSelector data-test='mailbox-selector-dropdown' onClick={onMailboxSelectorClick}>
              <UnreadLabel>
                <MailBoxLabel type='label'>{labelName}</MailBoxLabel>
                <MailBoxLabel color='secondary' type='label'>{`${
                  numUnread > 0 ? ` (${numUnread})` : ''
                }`}</MailBoxLabel>
                <Icons color='secondary' icon={Icon.ChevronDown} size='large' />
              </UnreadLabel>
            </MailBoxSelector>
          </HeaderButtons>
          {
            // Hide mobile search bar when inbox is empty
            threads.length > 0 && (
              <MobileSearch
                activeLabel={label}
                onCancel={() => {
                  hideMultiItemSelect();
                  setSelectedThreadIDs([]);
                }}
                setSearchQuery={setMobileSearchQuery}
              />
            )
          }
        </MobileHeaderContainer>
      </MobileView>
      <BrowserView>
        {headTitle}
        <Header onClick={onClick}>
          <TitleSearch>
            <Typography type='label'>
              {labelName}
              <UnreadText>{numUnread > 0 ? ` ${numUnread}` : ''}</UnreadText>
            </Typography>
            <IconButton icon={Icon.Search} onClick={openCommandPalette} />
          </TitleSearch>
          <Toolbar>
            <MailboxActions
              clearLastSelectedIndex={() => setLastSelectedIndex(null)}
              label={label}
              onRefresh={onRefresh}
              threads={threads}
            />
          </Toolbar>
        </Header>
      </BrowserView>
    </>
  );
};
