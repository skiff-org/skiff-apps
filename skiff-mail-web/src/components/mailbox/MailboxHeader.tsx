import { motion, useAnimation } from 'framer-motion';
import {
  Dropdown,
  DropdownItem,
  FilledVariant,
  Icon,
  IconButton,
  Icons,
  IconText,
  Size,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Type,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { isMobile, MobileView } from 'react-device-detect';
import { Helmet } from 'react-helmet';
import { useDispatch } from 'react-redux';
import { useGetMailFiltersQuery, useGetNumUnreadQuery, useUserLabelsQuery } from 'skiff-front-graphql';
import {
  abbreviateWalletAddress,
  BrowserDesktopView,
  DEFAULT_MOBILE_SETTINGS_INDICES,
  DEFAULT_WORKSPACE_EVENT_VERSION,
  isWindowsDesktopApp,
  MobileSearch,
  sendRNWebviewMsg,
  SettingValue,
  splitEmailToAliasAndDomain,
  TabPage,
  useDefaultEmailAlias,
  useRequiredCurrentUserData,
  WalletAliasWithName
} from 'skiff-front-utils';
import { SystemLabels, WorkspaceEventType } from 'skiff-graphql';
import { isCosmosHubAddress, POLL_INTERVAL_IN_MS } from 'skiff-utils';
import styled from 'styled-components';

import { useRouterLabelContext } from '../../context/RouterLabelContext';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import useSearchClick from '../../hooks/useSearchClick';
import { MailboxThreadInfo } from '../../models/thread';
import { skemailMailboxReducer } from '../../redux/reducers/mailboxReducer';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { getLabelDisplayName, HiddenLabels, splitUserLabelsByVariant, userLabelFromGraphQL } from '../../utils/label';
import { BulkAction, MailboxActionInfo, MailboxMultiSelectFilter } from '../../utils/mailboxActionUtils';
import { storeWorkspaceEvent } from '../../utils/userUtils';
import { FilterModal } from '../Settings/Filters/FilterModal';
import { useSettings } from '../Settings/useSettings';
import { Separator } from '../shared/headerStyles';

import BulkActionProgress from './BulkActionProgress';
import { MailboxActions } from './MailboxActions/MailboxActions';
import MailboxSearchBar from './MailboxSearch/MailboxSearchBar';
import SearchFilters from './MailboxSearch/SearchFilters';
import { QuickAliasActionBar } from './QuickAliasMailbox/QuickAliasActionBar';

interface MailboxHeaderProps {
  showSkeleton: boolean;
  setMobileSearchQuery: (s: string) => void;
  threads: MailboxThreadInfo[];
  setSelectAll: () => void;
  setClearAll: () => void;
  onRefresh: () => Promise<void>;
  walletAliasesWithName?: WalletAliasWithName[];
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

const Header = styled.div<{ $isSearchBarOpen?: boolean; $isQuickAliases?: boolean }>`
  ${(props) => props.$isSearchBarOpen && 'padding: 12px 0;'}
  display: flex;
  gap: ${(props) => (props.$isQuickAliases ? 0 : 8)}px;
  flex-direction: column;
  border-bottom: 1px solid var(--border-tertiary);
`;

const ActionBar = styled.div<{ $isSearchBarOpen?: boolean }>`
  display: flex;
  align-items: center;
  padding: ${(props) => (props.$isSearchBarOpen ? '0 8px 0 20px' : '6px 20px')}; //aligned with thread header
  box-sizing: border-box;
`;

const RightButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const LeftButtons = styled.div`
  display: flex;
  align-items: center;
  max-width: 100%;
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
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  if (!mailListHeaderElement || !mailListHeaderElement.isConnected) {
    setMailListElementCache();
  }
  mailListHeaderElement.style.transform = `translateY(calc((1 - ${progress}) * -${MOBILE_HEADER_HEIGHT}px))`;
  mailListHeaderElement.style.opacity = progress;
  if (transition) {
    mailListHeaderElement.style.transition = `transform ${transition}, opacity ${transition}`;
  }
  /* eslint-enable @typescript-eslint/no-unsafe-member-access */
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

const SearchPadding = styled.div`
  padding: 0px 16px;
`;

const MailboxHeaderText = styled.div`
  display: flex;
  gap: 4px;
`;

const RELOAD_ROTATION = 720;

interface MailboxFilter {
  key?: string;
  label: MailboxMultiSelectFilter;
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
  walletAliasesWithName
}: MailboxHeaderProps) => {
  const context = useRouterLabelContext();
  const [openFilterDropdown, setOpenFilterDropdown] = useState(false);
  const filterRef = useRef(null);
  // Fallback to search while context is loading/switching
  const label = context?.value || HiddenLabels.Search;
  const labelName = context?.name || 'Search';
  const { data, refetch: updateNumUnread } = useGetNumUnreadQuery({
    variables: { label },
    skip: label === SystemLabels.Sent || label === SystemLabels.Drafts,
    pollInterval: POLL_INTERVAL_IN_MS
  });

  const { data: userLabelData } = useUserLabelsQuery();
  const { aliasLabels } = splitUserLabelsByVariant(userLabelData?.userLabels?.map(userLabelFromGraphQL) ?? []);
  const labelIsAliasLabel = aliasLabels.some((aliasLabel) => aliasLabel.name === labelName);
  const { handleSearchClick } = useSearchClick();

  const { openSettings } = useSettings();
  const isSearch = label === HiddenLabels.Search;
  const isQuickAliases = label === SystemLabels.QuickAliases;
  const [rotation, setRotation] = useState(RELOAD_ROTATION);
  const controls = useAnimation();

  const dispatch = useDispatch();
  const { openModal } = useAppSelector((state) => state.modal);
  const { isSearchBarOpen } = useAppSelector((state) => state.search);
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
    shouldSkipNotifications: defaultShouldSkipNotifications,
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
        shouldSkipNotifications: undefined,
        shouldORFilters: undefined,
        name: undefined
      };

  const numUnreadRenderedThreads = threads.filter((thread) => !thread.attributes.read);

  // Make sure any changes to visible threads will trigger update of num unread
  useEffect(() => {
    void updateNumUnread();
  }, [threads, numUnreadRenderedThreads, updateNumUnread]);

  const numUnread = data?.unread ?? 0;
  const user = useRequiredCurrentUserData();
  const mobileMultiItemsActive = useAppSelector((state) => state.mobileDrawer.multipleItemSelector);
  const [shouldSelectAll, setShouldSelectAll] = useState(true);
  const isDrafts = label === SystemLabels.Drafts;
  const isImports = label === SystemLabels.Imports;
  const isTrash = label === SystemLabels.Trash;

  // Derive current active filter based on redux filter state
  const { filters } = useAppSelector((state) => state.mailbox);
  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);
  let activeFilter = MailboxMultiSelectFilter.ALL;
  if (filters.read === true) activeFilter = MailboxMultiSelectFilter.READ;
  if (filters.read === false) activeFilter = MailboxMultiSelectFilter.UNREAD;
  if (filters.attachments === true) activeFilter = MailboxMultiSelectFilter.ATTACHMENTS;

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

  const showContacts = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      openSettings({ tab: TabPage.Contacts, setting: SettingValue.Contacts });
    },
    [openSettings]
  );

  const setPendingMailboxAction = useCallback(
    (mailboxActionInfo: MailboxActionInfo) => {
      dispatch(skemailMailboxReducer.actions.setPendingMailboxAction(mailboxActionInfo));
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
    // only run when we open or close the multi selector checkboxes on mobile
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileMultiItemsActive]);

  const [defaultEmailAlias] = useDefaultEmailAlias(user.userID);

  const displayLabelName = getLabelDisplayName(labelName, walletAliasesWithName ?? [], isMobile);
  const fullWalletAddress = walletAliasesWithName?.find((walletAliasInfo) => {
    const labelNameAlias = splitEmailToAliasAndDomain(labelName).alias;
    // For cosmos address, we compare against the nameAlias, since the cosmos address is
    // the name instead of the wallet
    return isCosmosHubAddress(labelNameAlias)
      ? walletAliasInfo.nameAlias === labelName
      : walletAliasInfo.walletAlias === labelName;
  })?.walletAlias;
  const walletAlias = fullWalletAddress ? splitEmailToAliasAndDomain(fullWalletAddress).alias : undefined;

  const headTitle = (
    <Helmet>
      <title>
        {`${displayLabelName} ${numUnread > 0 ? `(${numUnread.toLocaleString()})` : ''} -
        ${defaultEmailAlias ?? user.username}`}
      </title>
    </Helmet>
  );

  useEffect(() => {
    const sendUnreadToWindowsApp = () => {
      if (!isWindowsDesktopApp()) {
        return;
      }
      try {
        const message = {
          type: 'unreadMailCount',
          data: { numUnread }
        };
        // Windows WebView2 injects a global `window.chrome` object
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        chrome.webview.postMessage(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send data to Windows app', error);
      }
    };

    // Communicate with react-native and update about unread mail count (for updating iOS badge and macOS badge)
    // If we are on mobile app, send unread count to react-native
    sendRNWebviewMsg('unreadMailCount', { numUnread });
    // If we are on Windows app, send unread count to Windows app
    sendUnreadToWindowsApp();

    const interval = setInterval(() => {
      sendRNWebviewMsg('unreadMailCount', { numUnread });
      sendUnreadToWindowsApp();
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
      label: MailboxMultiSelectFilter.ALL,
      onClick: () => {
        dispatch(skemailMailboxReducer.actions.setFilters({ filters: {} }));
      }
    },
    {
      key: 'unread-dropdown-filter',
      label: MailboxMultiSelectFilter.READ,
      onClick: () => {
        dispatch(skemailMailboxReducer.actions.setFilters({ filters: { read: true } }));
      }
    },
    {
      key: 'read-dropdown-filter',
      label: MailboxMultiSelectFilter.UNREAD,
      onClick: () => {
        dispatch(skemailMailboxReducer.actions.setFilters({ filters: { read: false } }));
      }
    },
    {
      key: 'attachments-filter',
      label: MailboxMultiSelectFilter.ATTACHMENTS,
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
                  dataTest='mobile-contacts-button'
                  icon={Icon.UserCircle}
                  onClick={showContacts}
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
                    numUnread > 0 ? ` (${numUnread.toLocaleString()})` : ''
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
        <Header $isQuickAliases={isQuickAliases} $isSearchBarOpen={isSearchBarOpen}>
          <MailboxSearchBar label={label} />
          <ActionBar $isSearchBarOpen={isSearchBarOpen} onClick={onClick}>
            <TitleSearch>
              <LeftButtons>
                <MailboxActions
                  clearLastSelectedIndex={clearLastSelectedIndex}
                  label={label}
                  onRefresh={onRefresh}
                  threads={threads}
                />
                {selectedThreadIDs.length === 0 && !isSearchBarOpen && (
                  <>
                    <MailboxHeaderText>
                      <Typography selectable={labelIsAliasLabel} weight={TypographyWeight.MEDIUM}>
                        {displayLabelName}
                      </Typography>
                      {fullWalletAddress && fullWalletAddress !== displayLabelName && walletAlias && (
                        <Tooltip>
                          <TooltipContent>{walletAlias}</TooltipContent>
                          <TooltipTrigger>
                            <Typography color='secondary' size={TypographySize.MEDIUM}>
                              • {abbreviateWalletAddress(walletAlias)}
                            </Typography>
                          </TooltipTrigger>
                        </Tooltip>
                      )}
                      <Typography color='link' selectable={false} size={TypographySize.MEDIUM}>
                        {numUnread > 0 ? ` ${numUnread.toLocaleString()}` : ''}
                      </Typography>
                    </MailboxHeaderText>
                    <BulkActionProgress />
                  </>
                )}
              </LeftButtons>
              {isSearchBarOpen && <SearchFilters />}
              {!isSearchBarOpen && selectedThreadIDs.length === 0 && (
                <RightButtons>
                  {isImports && (
                    <>
                      <IconText
                        label='Import'
                        onClick={() => {
                          openSettings({ tab: TabPage.Import, setting: SettingValue.ImportMail });
                        }}
                        startIcon={Icon.Upload}
                        variant={FilledVariant.FILLED}
                        weight={TypographyWeight.REGULAR}
                      />
                      <Separator />
                    </>
                  )}
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
                          defaultShouldSkipNotifications={defaultShouldSkipNotifications}
                          filterID={filterID}
                          refetchFilters={refetchFilters}
                        />
                      )}
                    </>
                  )}
                  {!isMobile && (
                    <IconText
                      onClick={(e?: React.MouseEvent) => {
                        showContacts(e);
                      }}
                      startIcon={Icon.UserCircle}
                      tooltip='Show contacts'
                      variant={FilledVariant.FILLED}
                    />
                  )}
                  <IconText onClick={handleSearchClick} startIcon={Icon.Search} variant={FilledVariant.FILLED} />
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
                  {!isMobile && isTrash && threads.length > 0 && (
                    <IconText
                      color='destructive'
                      label='Empty'
                      onClick={() => {
                        setPendingMailboxAction({ type: BulkAction.PERMANENTLY_DELETE, originLabelValue: label });
                      }}
                      startIcon={<Icons color='destructive' icon={Icon.Trash} />}
                      variant={FilledVariant.FILLED}
                      weight={TypographyWeight.REGULAR}
                    />
                  )}
                </RightButtons>
              )}
            </TitleSearch>
          </ActionBar>
          {!isSearchBarOpen && isQuickAliases && <QuickAliasActionBar />}
        </Header>
      </BrowserDesktopView>
    </>
  );
};
