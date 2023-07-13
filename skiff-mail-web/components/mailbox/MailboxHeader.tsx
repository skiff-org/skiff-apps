import { motion, useAnimation } from 'framer-motion';
import Head from 'next/head';
import {
  Dropdown,
  DropdownItem,
  FilledVariant,
  Icon,
  IconButton,
  Icons,
  IconText,
  Size,
  Type,
  Typography,
  TypographySize,
  TypographyWeight
} from '@skiff-org/skiff-ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { isMobile, MobileView } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useGetMailFiltersQuery, useGetNumUnreadQuery } from 'skiff-front-graphql';
import {
  BrowserDesktopView,
  DEFAULT_MOBILE_SETTINGS_INDICES,
  DEFAULT_WORKSPACE_EVENT_VERSION,
  MobileSearch,
  sendRNWebviewMsg,
  useDefaultEmailAlias,
  useRequiredCurrentUserData
} from 'skiff-front-utils';
import { SystemLabels, WorkspaceEventType } from 'skiff-graphql';
import { POLL_INTERVAL_IN_MS } from 'skiff-utils';
import styled from 'styled-components';

import { useRouterLabelContext } from '../../context/RouterLabelContext';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { MailboxThreadInfo } from '../../models/thread';
import { skemailMailboxReducer } from '../../redux/reducers/mailboxReducer';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { getLabelDisplayName, HiddenLabels } from '../../utils/label';
import { useNavigate } from '../../utils/navigation';
import { storeWorkspaceEvent } from '../../utils/userUtils';
import { FilterModal } from '../Settings/Filters/FilterModal';
import { useSettings } from '../Settings/useSettings';

import { MailboxActions, MailboxFilters } from './MailboxActions/MailboxActions';
import { MOCK_MAILBOX_REQUEST, MOCK_NUM_UNREAD } from '__mocks__/mockApiResponse';

interface MailboxHeaderProps {
  showSkeleton: boolean;
  setMobileSearchQuery: (s: string) => void;
  threads: MailboxThreadInfo[];
  setSelectAll: () => void;
  setClearAll: () => void;
  onRefresh: () => void | Promise<void>;
  onClick?: () => void;
  inputField?: JSX.Element;
}

const MAILBOX_ACTION_WIDTH = 354;

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
  box-sizing: border-box;
  ${isMobile && 'height: 57px;'}
  user-select: none;
  border-bottom: ${isMobile ? undefined : `1px solid var(--border-tertiary)`};
  ${isMobile && '-webkit-user-select: none;'}
`;

const UnreadText = styled.span`
  color: var(--text-link);
`;

const RightButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const LeftButtons = styled.div`
  display: flex;
  align-items: center;
  // prevent layout shift
  max-width: calc(100% - ${MAILBOX_ACTION_WIDTH});
`;

const UnreadLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
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
  width: 100%;
  box-sizing: border-box;
  &:active {
    background: var(--bg-cell-active);
    transition: background 0s;
  }
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
  background: var(--bg-main-container);
  width: 100%;
`;

const MultiItemsButton = styled.div`
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

const ActionSearch = styled.div`
  display: flex;
  align-items: center;
`;

const SearchPadding = styled.div`
  padding: 0px 16px;
`;

const RELOAD_ROTATION = 720;

interface MailboxFilter {
  key?: string;
  label: MailboxFilters;
  onClick: () => void;
}

const RELOAD_ANIMATION_S = 1;

export const MailboxHeader = ({
  showSkeleton,
  threads,
  setSelectAll,
  setClearAll,
  onRefresh,
  onClick,
  setMobileSearchQuery,
  inputField
}: MailboxHeaderProps) => {
  const context = useRouterLabelContext();
  const [openFilterDropdown, setOpenFilterDropdown] = useState(false);
  const { navigateToSearch } = useNavigate();
  const filterRef = useRef(null);
  // Fallback to search while context is loading/switching
  const label = context?.value || HiddenLabels.Search;
  const labelName = context?.name || 'Search';
  const { refetch: updateNumUnread } = useGetNumUnreadQuery({
    variables: { label },
    skip: label === SystemLabels.Sent || label === SystemLabels.Drafts,
    pollInterval: POLL_INTERVAL_IN_MS
  });

  const { openSettings } = useSettings();
  const isSearch = label === HiddenLabels.Search;
  const [rotation, setRotation] = useState(RELOAD_ROTATION);
  const controls = useAnimation();

  const { openModal } = useAppSelector((state) => state.modal);
  const isFilterModalOpen = openModal?.type === ModalType.Filter;
  const openNewFilterModal = () => {
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.Filter }));
    void storeWorkspaceEvent(WorkspaceEventType.CreateMailFilterClicked, '', DEFAULT_WORKSPACE_EVENT_VERSION);
  };
  const { refetch: refetchFilters } = useGetMailFiltersQuery();

  const {
    filterID,
    activeConditions: defaultConditions,
    selectedMoveToOption: defaultSelectedMoveToOption,
    selectedLabels: defaultSelectedLabels,
    selectedMarkAsOption: defaultSelectedMarkAsOption,
    shouldORFilters: defaultShouldORFilters,
    name: defaultName
  } = isFilterModalOpen
    ? openModal
    : {
        filterID: undefined,
        activeConditions: undefined,
        selectedMoveToOption: undefined,
        selectedLabels: undefined,
        selectedMarkAsOption: undefined,
        shouldORFilters: undefined,
        name: undefined
      };

  // make sure any changes to visible threads will trigger update of number unread
  useEffect(() => {
    void updateNumUnread();
  }, [threads]);

  const numUnread = MOCK_NUM_UNREAD;
  const user = useRequiredCurrentUserData();
  const mobileMultiItemsActive = useAppSelector((state) => state.mobileDrawer.multipleItemSelector);
  const [shouldSelectAll, setShouldSelectAll] = useState(true);
  const isDrafts = label === SystemLabels.Drafts;

  const dispatch = useDispatch();

  // Derive current active filter based on redux filters state
  const { filters } = useAppSelector((state) => state.mailbox);
  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);
  let activeFilter = MailboxFilters.ALL;
  if (filters.read === true) activeFilter = MailboxFilters.READ;
  if (filters.read === false) activeFilter = MailboxFilters.UNREAD;
  if (filters.attachments === true) activeFilter = MailboxFilters.ATTACHMENTS;

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
    (updatedSelectedThreadIDs: string[]) =>
      dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs: updatedSelectedThreadIDs })),
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
    // only run when we open/close the multi selector checkboxes on mobile
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileMultiItemsActive]);

  const [defaultEmailAlias] = useDefaultEmailAlias(user.userID);

  const displayLabelName = isMobile ? getLabelDisplayName(labelName) : labelName;
  const headTitle = (
    <Head>
      <title>
        {displayLabelName} {numUnread > 0 ? `(${numUnread.toLocaleString()})` : undefined} -{' '}
        {defaultEmailAlias ?? user.username}
      </title>
    </Head>
  );

  useEffect(() => {
    // Communicate with react-native and update about unread mail count (for updating iOS badge and macOS badge)
    // If we are on mobile app, send unread count to react-native
    sendRNWebviewMsg('unreadMailCount', { numUnread });
    const interval = setInterval(() => {
      sendRNWebviewMsg('unreadMailCount', { numUnread });
    }, POLL_INTERVAL_IN_MS);
    return () => {
      clearInterval(interval);
    };
  }, [numUnread]);

  useEffect(() => {
    // for mobile webview, ensure that we reset shouldSelectAll state when changing labels;
    // shouldSelectAll determines whether to show 'Select all' or 'Select none' on first selection of a mailbox item
    // following label change
    setShouldSelectAll(true);
  }, [label]);

  const clearLastSelectedIndex = useCallback(() => {
    setLastSelectedIndex(null);
  }, [setLastSelectedIndex]);

  const getEditButtonName = () => {
    if (inboxIsEmpty) return null;

    if (!mobileMultiItemsActive) return 'Edit';

    if (shouldSelectAll) return ' Select all';

    return 'Select none';
  };

  const mailboxFilterOptions: Array<MailboxFilter> = [
    {
      key: 'all-dropdown-filter',
      label: MailboxFilters.ALL,
      onClick: () => {
        dispatch(skemailMailboxReducer.actions.setFilters({ filters: {} }));
      }
    },
    {
      key: 'unread-dropdown-filter',
      label: MailboxFilters.READ,
      onClick: () => {
        dispatch(skemailMailboxReducer.actions.setFilters({ filters: { read: true } }));
      }
    },
    {
      key: 'read-dropdown-filter',
      label: MailboxFilters.UNREAD,
      onClick: () => {
        dispatch(skemailMailboxReducer.actions.setFilters({ filters: { read: false } }));
      }
    },
    {
      key: 'attachments-filter',
      label: MailboxFilters.ATTACHMENTS,
      onClick: () => {
        dispatch(skemailMailboxReducer.actions.setFilters({ filters: { attachments: true } }));
      }
    }
  ];
  return (
    <>
      <MobileView style={{ position: 'relative' }}>
        <MobileHeaderContainer id={MAIL_LIST_HEADER_ID} showSkeleton={showSkeleton}>
          <HeaderLabels onClick={onClick}>
            {!inboxIsEmpty && mobileMultiItemsActive && (
              <Typography
                color='link'
                onClick={onCancelClick}
                size={TypographySize.LARGE}
                weight={TypographyWeight.MEDIUM}
              >
                Cancel
              </Typography>
            )}
            <Typography
              color='link'
              onClick={onRightItemClick}
              size={TypographySize.LARGE}
              weight={TypographyWeight.MEDIUM}
            >
              {/* Don't show edit button when inbox is empty */}
              <MultiItemsButton>{getEditButtonName()}</MultiItemsButton>
            </Typography>
            {!mobileMultiItemsActive && (
              <MailboxActionBar>
                <IconButton
                  icon={Icon.Filter}
                  onClick={showFilterDrawer}
                  size={Size.LARGE}
                  type={Type.SECONDARY}
                  variant={FilledVariant.UNFILLED}
                />
                <IconButton
                  dataTest='mobile-settings-button'
                  icon={Icon.Settings}
                  onClick={showSettingsDrawer}
                  size={Size.LARGE}
                  type={Type.SECONDARY}
                  variant={FilledVariant.UNFILLED}
                />
              </MailboxActionBar>
            )}
          </HeaderLabels>
          {headTitle}
          {!isSearch && (
            <HeaderButtons onClick={onClick}>
              <MailBoxSelector data-test='mailbox-selector-dropdown' onClick={onMailboxSelectorClick}>
                <UnreadLabel>
                  <Typography
                    maxWidth={!!numUnread ? '80%' : undefined} // only set max width if we need to render the numRead count
                    size={TypographySize.H2}
                    weight={TypographyWeight.MEDIUM}
                  >
                    {displayLabelName}
                  </Typography>
                  <Typography color='secondary' size={TypographySize.H2} weight={TypographyWeight.MEDIUM}>{`${
                    numUnread > 0 ? ` (${numUnread})` : ''
                  }`}</Typography>
                  <Icons color='secondary' icon={Icon.ChevronDown} size={Size.X_MEDIUM} />
                </UnreadLabel>
              </MailBoxSelector>
            </HeaderButtons>
          )}
          {
            // Hide mobile search bar when inbox is empty
            threads.length > 0 && (
              <SearchPadding>
                <MobileSearch
                  activeLabel={label}
                  onCancel={() => {
                    hideMultiItemSelect();
                    setSelectedThreadIDs([]);
                  }}
                  setSearchQuery={setMobileSearchQuery}
                />
              </SearchPadding>
            )
          }
        </MobileHeaderContainer>
      </MobileView>
      <BrowserDesktopView>
        {headTitle}
        <Header onClick={onClick}>
          {!isSearch && (
            <TitleSearch>
              <LeftButtons>
                <MailboxActions
                  clearLastSelectedIndex={clearLastSelectedIndex}
                  label={label}
                  onRefresh={onRefresh}
                  threads={threads}
                />
                {selectedThreadIDs.length === 0 && (
                  <Typography weight={TypographyWeight.MEDIUM}>
                    {displayLabelName}
                    <UnreadText>{numUnread > 0 ? ` ${numUnread}` : ''}</UnreadText>
                  </Typography>
                )}
              </LeftButtons>
              {selectedThreadIDs.length === 0 && (
                <RightButtons>
                  {!isDrafts && !isSearch && (
                    <IconText
                      endIcon={Icon.ChevronDown}
                      label={activeFilter}
                      onClick={() => {
                        setOpenFilterDropdown((prev) => !prev);
                      }}
                      ref={filterRef}
                      variant={FilledVariant.FILLED}
                      weight={TypographyWeight.REGULAR}
                    />
                  )}
                  <Dropdown
                    buttonRef={filterRef}
                    gapFromAnchor={6}
                    portal
                    setShowDropdown={setOpenFilterDropdown}
                    showDropdown={openFilterDropdown}
                  >
                    {mailboxFilterOptions.map((option) => {
                      return (
                        <DropdownItem
                          active={option.label === activeFilter}
                          key={option.key}
                          label={option.label}
                          onClick={() => {
                            setOpenFilterDropdown(false);
                            option.onClick();
                          }}
                        />
                      );
                    })}
                  </Dropdown>
                  {!isMobile && (
                    <>
                      <IconText
                        onClick={() => {
                          openNewFilterModal();
                        }}
                        startIcon={Icon.FilterPlus}
                        variant={FilledVariant.FILLED}
                      />
                      {isFilterModalOpen && (
                        <FilterModal
                          defaultConditions={defaultConditions}
                          defaultName={defaultName}
                          defaultSelectedLabels={defaultSelectedLabels}
                          defaultSelectedMarkAsOption={defaultSelectedMarkAsOption}
                          defaultSelectedMoveToOption={defaultSelectedMoveToOption}
                          defaultShouldORFilters={defaultShouldORFilters}
                          filterID={filterID}
                          refetchFilters={refetchFilters}
                        />
                      )}
                    </>
                  )}
                  <IconText onClick={navigateToSearch} startIcon={Icon.Search} variant={FilledVariant.FILLED} />
                  {!isMobile && (
                    <IconText
                      onClick={() => {
                        void onRefresh();
                        void controls.start({ rotate: rotation });
                        setRotation((prev) => prev + 720);
                      }}
                      startIcon={
                        <motion.div
                          animate={controls}
                          initial={false}
                          transition={{
                            duration: RELOAD_ANIMATION_S,
                            ease: 'easeInOut',
                            times: [0, 0.2, 0.5, 0.8, 1]
                          }}
                        >
                          <Icons color='secondary' icon={Icon.Reload} />
                        </motion.div>
                      }
                      variant={FilledVariant.FILLED}
                    />
                  )}
                </RightButtons>
              )}
            </TitleSearch>
          )}
          {isSearch && (
            <ActionSearch>
              <MailboxActions
                clearLastSelectedIndex={clearLastSelectedIndex}
                label={label}
                onRefresh={onRefresh}
                threads={threads}
              />
              {selectedThreadIDs.length === 0 && (
                <Typography minWidth='fit-content' weight={TypographyWeight.MEDIUM}>
                  {displayLabelName}
                </Typography>
              )}
              {inputField}
            </ActionSearch>
          )}
        </Header>
      </BrowserDesktopView>
    </>
  );
};
