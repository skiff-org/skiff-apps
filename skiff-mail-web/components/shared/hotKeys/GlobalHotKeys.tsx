import { isString } from 'lodash';
import { useRouter } from 'next/router';
import React, { useCallback, useMemo } from 'react';
import { GlobalHotKeys, configure } from 'react-hotkeys';
import { useDispatch } from 'react-redux';
import { SystemLabels } from 'skiff-graphql';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useActiveThreadActions } from '../../../hooks/useActiveThreadActions';
import { useAvailableUserLabels } from '../../../hooks/useAvailableLabels';
import { useCurrentLabel } from '../../../hooks/useCurrentLabel';
import useLocalSetting, { ThreadDisplayFormat } from '../../../hooks/useLocalSetting';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { skemailHotKeysReducer } from '../../../redux/reducers/hotkeysReducer';
import { skemailMailboxReducer } from '../../../redux/reducers/mailboxReducer';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { getLabelFromPathParams, isUserLabel, LABEL_TO_SYSTEM_LABEL } from '../../../utils/label';
import { useNavigate } from '../../../utils/navigation';
import { useSettings } from '../../Settings/useSettings';

import {
  GlobalKeyActions,
  globalMultiCombinationKeyMap,
  globalSingleCombinationKeyMap,
  globalSingleKeyMap,
  HotKeyHandlers
} from './hotKeys';

const INPUT_TAGS = ['input', 'select', 'textarea'];

configure({
  ignoreEventsCondition: () => false,
  stopEventPropagationAfterHandling: false
});

const GlobalHotkeys = () => {
  const router = useRouter();
  const { navigateToSystemLabel } = useNavigate();
  const dispatch = useDispatch();
  const [threadFormat, setThreadFormat] = useLocalSetting('threadFormat');
  const { isSettingsOpen, closeSettings } = useSettings();

  const { composeOpen, isComposeCollapsed } = useAppSelector((state) => state.modal);
  const { existingLabels: selectedThreadsLabels } = useAvailableUserLabels();
  const { activeThreadLabelsDropdownOpen, mailboxLabelsDropdownOpen } = useAppSelector((state) => state.hotkeys);
  const { hoveredThreadIndex, hoveredThreadID, selectedThreadIDs, renderedMailboxThreadsCount } = useAppSelector(
    (state) => state.mailbox
  );
  const isComposing = composeOpen && !isComposeCollapsed;

  const { archiveThreads, trashThreads, moveThreads, setActiveThreadID, removeUserLabel, activeThreadID } =
    useThreadActions();

  const { reply, replyAll, forward, activeThreadLabels } = useActiveThreadActions();

  const label = useCurrentLabel();
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

  const handleOpenCloseLabelsMenu = () => {
    if (selectedThreadIDs.length) {
      // open mailbox labels number
      dispatch(skemailHotKeysReducer.actions.setMailboxLabelsDropdownOpen());
    } else if (activeThreadID) {
      // open active thread labels menu
      dispatch(skemailHotKeysReducer.actions.setActiveThreadLabelMenuOpen());
    }
  };

  // open compose
  const openComposeHandler = useCallback(
    (e: KeyboardEvent | undefined) => {
      // ignore if meta+c / ctrl+c
      if (e?.metaKey || e?.ctrlKey) return;
      if (composeOpen && !isComposeCollapsed) return;
      if (!composeOpen) {
        // open empty compose
        dispatch(skemailModalReducer.actions.openEmptyCompose());
      } else {
        // expand collapsed compose
        dispatch(skemailModalReducer.actions.expand());
      }
    },
    [composeOpen, isComposeCollapsed, dispatch]
  );

  // collapse compose
  const escapeHandler = useCallback(() => {
    // if settings menu is open – close
    if (isSettingsOpen) {
      closeSettings();
    }
    // if the labels menu is open - close
    if (activeThreadLabelsDropdownOpen || mailboxLabelsDropdownOpen) handleOpenCloseLabelsMenu();

    // if compose is open - collapse
    if (!isComposeCollapsed) dispatch(skemailModalReducer.actions.collapse());
  }, [
    isComposeCollapsed,
    activeThreadLabelsDropdownOpen,
    mailboxLabelsDropdownOpen,
    closeSettings,
    dispatch,
    isSettingsOpen,
    handleOpenCloseLabelsMenu
  ]);

  // open command palette
  const cmdPHandler = useCallback(() => {
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.CommandPalette }));
  }, [dispatch]);

  // change thread layout
  // full format
  const fullFormatHandler = useCallback(() => {
    if (threadFormat === ThreadDisplayFormat.Full) return;
    setThreadFormat(ThreadDisplayFormat.Full);
  }, [threadFormat, setThreadFormat]);

  // change thread layout
  // right format
  const rightFormatHandler = useCallback(() => {
    if (threadFormat === ThreadDisplayFormat.Right) return;
    setThreadFormat(ThreadDisplayFormat.Right);
  }, [threadFormat, setThreadFormat]);

  const scrollToHoveredThread = () => {
    const threadElement = document.getElementById(hoveredThreadID);
    threadElement?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  };

  const LAST_RENDERED_THREAD_INDEX = renderedMailboxThreadsCount - 1;

  // up arrow
  const upArrowHandler = () => {
    // when label dropdown is open - prevent and keep event
    if (activeThreadLabelsDropdownOpen || mailboxLabelsDropdownOpen) return true;

    const prevThreadIndex = hoveredThreadIndex === 0 ? LAST_RENDERED_THREAD_INDEX : hoveredThreadIndex - 1;
    dispatch(skemailMailboxReducer.actions.setHoveredThreadIndex({ hoveredThreadIndex: prevThreadIndex }));
    scrollToHoveredThread();
  };

  // down arrow
  const downArrowHandler = () => {
    // when label dropdown is open - prevent and keep event
    if (activeThreadLabelsDropdownOpen || mailboxLabelsDropdownOpen) return true;

    const nextThreadIndex = hoveredThreadIndex === LAST_RENDERED_THREAD_INDEX ? 0 : hoveredThreadIndex + 1;
    dispatch(skemailMailboxReducer.actions.setHoveredThreadIndex({ hoveredThreadIndex: nextThreadIndex }));
    scrollToHoveredThread();
  };

  // open thread details
  const enterHandler = useCallback(() => {
    // only change if hoveredThreadID exists (this prevents thread being reset on navigation)
    // and thus prevents a bug where notification do not open thread
    if (!hoveredThreadID) return;

    // when label dropdown is open - prevent and keep event
    if (activeThreadLabelsDropdownOpen || mailboxLabelsDropdownOpen) return true;

    setActiveThreadID({ threadID: hoveredThreadID });
    dispatch(skemailModalReducer.actions.collapse());
  }, [activeThreadLabelsDropdownOpen, dispatch, label, mailboxLabelsDropdownOpen, setActiveThreadID, hoveredThreadID]);

  // select thread
  const selectHandler = useCallback(() => {
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
  }, [dispatch, selectedThreadIDs, hoveredThreadID]);

  // archive threads
  const archiveHandler = useCallback(() => {
    if (isTrashOrArchive || isDrafts) return;
    if (selectedThreadIDs.length) {
      void archiveThreads(selectedThreadIDs);
    } else if (activeThreadID) {
      void archiveThreads([activeThreadID]);
    }
  }, [archiveThreads, isTrashOrArchive, isDrafts, selectedThreadIDs, activeThreadID]);

  // trash threads
  const trashHandler = useCallback(() => {
    if (isTrashOrArchive) return;
    if (selectedThreadIDs.length) {
      void trashThreads(selectedThreadIDs, isDrafts);
    } else if (activeThreadID) {
      void trashThreads([activeThreadID], isDrafts);
    }
  }, [trashThreads, isTrashOrArchive, isDrafts, selectedThreadIDs, activeThreadID]);

  // undo trash or archive
  const undoHandler = useCallback(() => {
    if (!isTrashOrArchive) return;
    if (selectedThreadIDs.length) {
      void moveThreads(selectedThreadIDs, LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox], [systemLabel]);
    } else if (activeThreadID) {
      void moveThreads([activeThreadID], LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox], [systemLabel]);
    }
  }, [moveThreads, isTrashOrArchive, selectedThreadIDs, systemLabel, activeThreadID]);

  const handleRemoveAllUserLabels = async () => {
    if (selectedThreadIDs.length) {
      await removeUserLabel(selectedThreadIDs, selectedThreadsLabels.filter(isUserLabel));
    } else if (activeThreadID) {
      await removeUserLabel([activeThreadID], activeThreadLabels);
    }
  };

  // go to mailbox
  const goToMailboxHandler = useCallback((e: KeyboardEvent | undefined) => {
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
  }, []);

  const openShortcutsHandler = useCallback(() => {
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.Shortcuts }));
  }, []);

  const wrapActionHandler =
    (
      handler: (e: KeyboardEvent | undefined) => void,
      {
        preventWhenTyping,
        preventWhenMetaPressed
      }: {
        preventWhenTyping?: boolean;
        preventWhenMetaPressed?: boolean;
      }
    ) =>
    (e: KeyboardEvent | undefined) => {
      const inInput = e && INPUT_TAGS.includes((e.target as HTMLElement).tagName.toLowerCase());
      if (preventWhenTyping && (isComposing || inInput)) return;
      if (preventWhenMetaPressed && e?.metaKey) return;
      e?.preventDefault();
      e?.stopImmediatePropagation();
      handler(e);
    };

  const singleKeyHandlers: HotKeyHandlers<typeof globalSingleKeyMap> = {
    [GlobalKeyActions.OPEN_COMMAND_PALETTE]: wrapActionHandler(cmdPHandler, { preventWhenTyping: true }),
    [GlobalKeyActions.OPEN_COMPOSE]: wrapActionHandler(openComposeHandler, {
      preventWhenTyping: true,
      preventWhenMetaPressed: true
    }),
    [GlobalKeyActions.ESCAPE]: wrapActionHandler(escapeHandler, { preventWhenTyping: false }),
    [GlobalKeyActions.UP_ARROW]: wrapActionHandler(upArrowHandler, { preventWhenTyping: true }),
    [GlobalKeyActions.DOWN_ARROW]: wrapActionHandler(downArrowHandler, { preventWhenTyping: true }),
    [GlobalKeyActions.ENTER]: wrapActionHandler(enterHandler, { preventWhenTyping: true }),
    [GlobalKeyActions.SELECT_THREAD]: wrapActionHandler(selectHandler, { preventWhenTyping: true }),
    [GlobalKeyActions.ARCHIVE]: wrapActionHandler(archiveHandler, { preventWhenTyping: true }),
    [GlobalKeyActions.UNDO]: wrapActionHandler(undoHandler, { preventWhenTyping: true }),
    [GlobalKeyActions.REPLY_ALL]: wrapActionHandler(replyAll, {
      preventWhenTyping: true,
      preventWhenMetaPressed: true
    }),
    [GlobalKeyActions.REPLY]: wrapActionHandler(reply, { preventWhenTyping: true, preventWhenMetaPressed: true }),
    [GlobalKeyActions.FORWARD]: wrapActionHandler(forward, { preventWhenTyping: true, preventWhenMetaPressed: true }),
    [GlobalKeyActions.LABELS_MENU]: wrapActionHandler(handleOpenCloseLabelsMenu, { preventWhenTyping: true })
  };

  const singleCombinationHandlers: HotKeyHandlers<typeof globalSingleCombinationKeyMap> = {
    [GlobalKeyActions.OPEN_COMMAND_PALETTE]: wrapActionHandler(cmdPHandler, { preventWhenTyping: true }),
    [GlobalKeyActions.CMD_1]: wrapActionHandler(fullFormatHandler, { preventWhenTyping: false }),
    [GlobalKeyActions.CMD_2]: wrapActionHandler(rightFormatHandler, { preventWhenTyping: false }),
    [GlobalKeyActions.TRASH]: wrapActionHandler(trashHandler, { preventWhenTyping: true }),
    [GlobalKeyActions.REMOVE_ALL_LABELS]: wrapActionHandler(() => void handleRemoveAllUserLabels(), {
      preventWhenTyping: true
    }),
    [GlobalKeyActions.OPEN_SHORTCUTS]: wrapActionHandler(openShortcutsHandler, { preventWhenTyping: true })
  };

  const multiCombinationHandlers: HotKeyHandlers<typeof globalMultiCombinationKeyMap> = {
    [GlobalKeyActions.GO_TO_MAILBOX]: wrapActionHandler(goToMailboxHandler, { preventWhenTyping: true })
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
