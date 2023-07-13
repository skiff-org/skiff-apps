import isString from 'lodash/isString';
import { useRouter } from 'next/router';
import React, { useCallback, useMemo } from 'react';
import { GlobalHotKeys, configure } from 'react-hotkeys';
import { useDispatch } from 'react-redux';
import { TabPage, isReactNativeDesktopApp } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useActiveThreadActions } from '../../../hooks/useActiveThreadActions';
import { useAvailableUserLabels } from '../../../hooks/useAvailableLabels';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { skemailHotKeysReducer } from '../../../redux/reducers/hotkeysReducer';
import { skemailMailboxReducer } from '../../../redux/reducers/mailboxReducer';
import { ComposeExpandTypes, skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { getLabelFromPathParams, isPlainLabel, LABEL_TO_SYSTEM_LABEL } from '../../../utils/label';
import { useNavigate } from '../../../utils/navigation';
import { useSettings } from '../../Settings/useSettings';

import { INPUT_TAGS } from './GlobalHotKeys.constants';
import { isDropdownOpen } from './GlobalHotKeys.utils';
import {
  GlobalKeyActions,
  globalMultiCombinationKeyMap,
  globalSingleCombinationKeyMap,
  globalSingleKeyMap,
  HotKeyHandlers
} from './hotKeys';

configure({
  ignoreEventsCondition: () => false,
  stopEventPropagationAfterHandling: false
});

const GlobalHotkeys = () => {
  const router = useRouter();
  const { navigateToSystemLabel } = useNavigate();
  const dispatch = useDispatch();

  const { composeOpen, replyComposeOpen, composeCollapseState } = useAppSelector((state) => state.modal);
  const collapsed = composeCollapseState === ComposeExpandTypes.Collapsed;
  const { existingLabels: selectedThreadsLabels } = useAvailableUserLabels();
  const { hoveredThreadIndex, hoveredThreadID, selectedThreadIDs, renderedMailboxThreadsCount } = useAppSelector(
    (state) => state.mailbox
  );
  const { isSettingsOpen } = useSettings();
  const isComposing = (composeOpen && !collapsed) || isSettingsOpen || replyComposeOpen;

  const { archiveThreads, trashThreads, moveThreads, setActiveThreadID, removeUserLabel, activeThreadID } =
    useThreadActions();

  const { reply, replyAll, forward, activeThreadLabels } = useActiveThreadActions();

  const systemLabel = useMemo(() => {
    if (isString(router.query.systemLabel)) {
      return getLabelFromPathParams(router.query.systemLabel);
    }
    return undefined;
  }, [router.query.systemLabel]);

  const isDrafts = systemLabel === SystemLabels.Drafts;
  const isArchive = systemLabel === SystemLabels.Archive;
  const isTrash = systemLabel === SystemLabels.Trash;
  const isTrashOrArchive = isTrash || isArchive;

  // Opens the label dropdown for selected threads
  const openLabelsMenuHandler = (e?: KeyboardEvent) => {
    // Do nothing if there are no selected threads and no active thread
    if (!selectedThreadIDs.length && !activeThreadID) return;

    e?.preventDefault();
    e?.stopImmediatePropagation();

    // Open mailbox label dropdown for selected threads
    if (selectedThreadIDs.length) {
      dispatch(skemailHotKeysReducer.actions.setMailboxLabelsDropdownOpen());
      return;
    }

    // Open active thread labels dropdown
    dispatch(skemailHotKeysReducer.actions.setActiveThreadLabelMenuOpen());
  };

  // open compose
  const openComposeHandler = useCallback(
    (e: KeyboardEvent | undefined) => {
      // ignore if meta+c / ctrl+c
      if (e?.metaKey || e?.ctrlKey) return;
      if (composeOpen && !collapsed) return;

      e?.preventDefault();
      e?.stopImmediatePropagation();

      if (!composeOpen) {
        // open empty compose
        dispatch(skemailModalReducer.actions.openEmptyCompose());
      } else {
        // expand collapsed compose
        dispatch(skemailModalReducer.actions.expand());
      }
    },
    [composeOpen, collapsed, dispatch]
  );

  // collapse compose
  const escapeHandler = useCallback(
    (e?: KeyboardEvent) => {
      // Do nothing if neither the compose window nor a thread is open
      if (collapsed && !activeThreadID) return;

      e?.preventDefault();
      e?.stopImmediatePropagation();

      // if compose is open - collapse
      if (!collapsed) {
        dispatch(skemailModalReducer.actions.collapse());
        return;
      }

      setActiveThreadID(undefined);
    },
    [activeThreadID, collapsed, dispatch, setActiveThreadID]
  );

  // open command palette
  const cmdPHandler = useCallback(
    (e?: KeyboardEvent) => {
      e?.preventDefault();
      e?.stopImmediatePropagation();
      dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.CommandPalette }));
    },
    [dispatch]
  );

  const scrollToHoveredThread = () => {
    const threadElement = document.getElementById(hoveredThreadID);
    threadElement?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  };

  const lastRenderedThreadIndex = renderedMailboxThreadsCount - 1;

  // Up arrow
  // Navigates through threads in the mailbox
  const upArrowHandler = (e?: KeyboardEvent) => {
    e?.preventDefault();
    e?.stopImmediatePropagation();

    const prevThreadIndex = hoveredThreadIndex === 0 ? lastRenderedThreadIndex : hoveredThreadIndex - 1;
    dispatch(skemailMailboxReducer.actions.setHoveredThreadIndex({ hoveredThreadIndex: prevThreadIndex }));
    scrollToHoveredThread();
  };

  // Down arrow
  // Navigates through threads in the mailbox
  const downArrowHandler = (e?: KeyboardEvent) => {
    e?.preventDefault();
    e?.stopImmediatePropagation();

    const nextThreadIndex = hoveredThreadIndex === lastRenderedThreadIndex ? 0 : hoveredThreadIndex + 1;
    dispatch(skemailMailboxReducer.actions.setHoveredThreadIndex({ hoveredThreadIndex: nextThreadIndex }));
    scrollToHoveredThread();
  };

  // open thread details
  const enterHandler = useCallback(
    (e?: KeyboardEvent) => {
      // only change if hoveredThreadID exists (this prevents thread being reset on navigation)
      // and thus prevents a bug where notification do not open thread
      if (!hoveredThreadID) return;

      e?.preventDefault();
      e?.stopImmediatePropagation();

      setActiveThreadID({ threadID: hoveredThreadID });
      dispatch(skemailModalReducer.actions.collapse());
    },
    [hoveredThreadID, setActiveThreadID, dispatch]
  );

  // select thread
  const selectHandler = useCallback(
    (e?: KeyboardEvent) => {
      e?.preventDefault();
      e?.stopImmediatePropagation();
      if (!selectedThreadIDs.includes(hoveredThreadID)) {
        dispatch(
          skemailMailboxReducer.actions.setSelectedThreadIDs({
            selectedThreadIDs: [...selectedThreadIDs, hoveredThreadID]
          })
        );
      } else {
        dispatch(
          skemailMailboxReducer.actions.setSelectedThreadIDs({
            selectedThreadIDs: selectedThreadIDs.filter((threadID) => threadID !== hoveredThreadID)
          })
        );
      }
    },
    [dispatch, selectedThreadIDs, hoveredThreadID]
  );

  // archive threads
  const archiveHandler = useCallback(
    (e?: KeyboardEvent) => {
      if (isTrashOrArchive || isDrafts) return;

      e?.preventDefault();
      e?.stopImmediatePropagation();

      if (selectedThreadIDs.length) {
        void archiveThreads(selectedThreadIDs);
      } else if (activeThreadID) {
        void archiveThreads([activeThreadID]);
      }
    },
    [archiveThreads, isTrashOrArchive, isDrafts, selectedThreadIDs, activeThreadID]
  );

  // trash threads
  const trashHandler = useCallback(
    (e?: KeyboardEvent) => {
      if (isTrashOrArchive) return;

      e?.preventDefault();
      e?.stopImmediatePropagation();

      if (selectedThreadIDs.length) {
        void trashThreads(selectedThreadIDs, isDrafts);
      } else if (activeThreadID) {
        void trashThreads([activeThreadID], isDrafts);
      }
    },
    [trashThreads, isTrashOrArchive, isDrafts, selectedThreadIDs, activeThreadID]
  );

  // undo trash or archive
  const undoHandler = useCallback(
    (e?: KeyboardEvent) => {
      if (!isTrashOrArchive) return;

      e?.preventDefault();
      e?.stopImmediatePropagation();

      if (selectedThreadIDs.length) {
        void moveThreads(selectedThreadIDs, LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox], [systemLabel]);
      } else if (activeThreadID) {
        void moveThreads([activeThreadID], LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox], [systemLabel]);
      }
    },
    [moveThreads, isTrashOrArchive, selectedThreadIDs, systemLabel, activeThreadID]
  );

  const handleRemoveAllUserLabels = async (e?: KeyboardEvent) => {
    e?.preventDefault();
    e?.stopImmediatePropagation();
    if (selectedThreadIDs.length) {
      await removeUserLabel(selectedThreadIDs, selectedThreadsLabels.filter(isPlainLabel));
    } else if (activeThreadID) {
      await removeUserLabel([activeThreadID], activeThreadLabels);
    }
  };

  // go to mailbox
  const goToMailboxHandler = useCallback(
    (e?: KeyboardEvent) => {
      e?.preventDefault();
      e?.stopImmediatePropagation();
      switch (e?.key) {
        case 'i':
          // go to Inbox
          void navigateToSystemLabel(SystemLabels.Inbox);
          break;
        case 't':
          // go to Sent
          void navigateToSystemLabel(SystemLabels.Sent);
          break;
        case 'd':
          // go to Drafts
          void navigateToSystemLabel(SystemLabels.Drafts);
          break;
        case '!':
          // go to Spam
          void navigateToSystemLabel(SystemLabels.Spam);
          break;
        case 'e':
          // go to Archive
          void navigateToSystemLabel(SystemLabels.Archive);
          break;
        case '#':
          // go to Trash
          void navigateToSystemLabel(SystemLabels.Trash);
          break;
        default:
          break;
      }
    },
    [navigateToSystemLabel]
  );

  const openShortcutsHandler = useCallback(
    (e?: KeyboardEvent) => {
      e?.preventDefault();
      e?.stopImmediatePropagation();
      dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.Shortcuts }));
    },
    [dispatch]
  );

  const { openSettings } = useSettings();
  const openSettingsPage = () => {
    openSettings({ tab: TabPage.Account });
  };

  const wrapActionHandler =
    (
      handler: (e: KeyboardEvent | undefined) => void,
      {
        preventWhenTyping = true,
        preventWhenMetaPressed
      }: {
        preventWhenTyping?: boolean;
        preventWhenMetaPressed?: boolean;
      }
    ) =>
    (e: KeyboardEvent | undefined) => {
      // Disable all hot keys if a dropdown is open
      if (e && isDropdownOpen(e)) return;

      const inInput = e && INPUT_TAGS.includes((e.target as HTMLElement).tagName.toLowerCase());
      if (preventWhenTyping && (isComposing || inInput)) return;
      if (preventWhenMetaPressed && e?.metaKey) return;
      handler(e);
    };

  const singleKeyHandlers: HotKeyHandlers<typeof globalSingleKeyMap> = {
    [GlobalKeyActions.OPEN_COMMAND_PALETTE]: wrapActionHandler(cmdPHandler, {}),
    [GlobalKeyActions.OPEN_COMPOSE]: wrapActionHandler(openComposeHandler, { preventWhenMetaPressed: true }),
    [GlobalKeyActions.ESCAPE]: wrapActionHandler(escapeHandler, { preventWhenTyping: false }),
    [GlobalKeyActions.UP_ARROW]: wrapActionHandler(upArrowHandler, {}),
    [GlobalKeyActions.DOWN_ARROW]: wrapActionHandler(downArrowHandler, {}),
    [GlobalKeyActions.ENTER]: wrapActionHandler(enterHandler, {}),
    [GlobalKeyActions.SELECT_THREAD]: wrapActionHandler(selectHandler, {}),
    [GlobalKeyActions.ARCHIVE]: wrapActionHandler(archiveHandler, {}),
    [GlobalKeyActions.UNDO]: wrapActionHandler(undoHandler, {}),
    [GlobalKeyActions.REPLY_ALL]: wrapActionHandler(replyAll, { preventWhenMetaPressed: true }),
    [GlobalKeyActions.REPLY]: wrapActionHandler(reply, { preventWhenMetaPressed: true }),
    [GlobalKeyActions.FORWARD]: wrapActionHandler(forward, { preventWhenMetaPressed: true }),
    [GlobalKeyActions.LABELS_MENU]: wrapActionHandler(openLabelsMenuHandler, {})
  };

  const singleCombinationHandlers: HotKeyHandlers<typeof globalSingleCombinationKeyMap> = {
    [GlobalKeyActions.OPEN_COMMAND_PALETTE]: wrapActionHandler(cmdPHandler, {}),
    [GlobalKeyActions.TRASH]: wrapActionHandler(trashHandler, {}),
    [GlobalKeyActions.REMOVE_ALL_LABELS]: wrapActionHandler(() => void handleRemoveAllUserLabels(), {}),
    [GlobalKeyActions.OPEN_SHORTCUTS]: wrapActionHandler(openShortcutsHandler, {}),
    [GlobalKeyActions.OPEN_SETTINGS]: wrapActionHandler(() => {
      if (isReactNativeDesktopApp()) {
        openSettingsPage();
      }
    }, {})
  };

  const multiCombinationHandlers: HotKeyHandlers<typeof globalMultiCombinationKeyMap> = {
    [GlobalKeyActions.GO_TO_MAILBOX]: wrapActionHandler(goToMailboxHandler, {})
  };

  return (
    <>
      {/**
       * Separate handler for GO_TO_MAILBOX see: https://linear.app/skiff/issue/EMAIL-2285/tab-changes-when-using-globalhotkeys
       * Multi-key handlers should come before single key handlers since key combinations need to be checked before single keys are checked
       */}
      <GlobalHotKeys
        allowChanges // Permits the handlers to change after the component mounts
        handlers={multiCombinationHandlers}
        keyMap={globalMultiCombinationKeyMap}
      />
      <GlobalHotKeys allowChanges handlers={singleCombinationHandlers} keyMap={globalSingleCombinationKeyMap} />
      <GlobalHotKeys allowChanges handlers={singleKeyHandlers} keyMap={globalSingleKeyMap} />
    </>
  );
};

export default GlobalHotkeys;
