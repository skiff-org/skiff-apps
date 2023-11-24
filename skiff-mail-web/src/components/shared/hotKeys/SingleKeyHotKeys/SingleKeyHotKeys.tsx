import { useCallback } from 'react';
import { configure, GlobalHotKeys } from 'react-hotkeys';
import { useDispatch } from 'react-redux';
import { HotKeyHandlers, onHandleHotKeyPress, useUserPreference } from 'skiff-front-utils';
import { SystemLabels, ThreadDisplayFormat } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';

import { useAppSelector } from '../../../../hooks/redux/useAppSelector';
import { useActiveThreadActions } from '../../../../hooks/useActiveThreadActions';
import { useGetEffectiveThreadIDs } from '../../../../hooks/useGetEffectiveThreadIDs';
import { useThreadActions } from '../../../../hooks/useThreadActions';
import { skemailHotKeysReducer } from '../../../../redux/reducers/hotkeysReducer';
import { skemailMailboxReducer } from '../../../../redux/reducers/mailboxReducer';
import { ComposeExpandTypes, skemailModalReducer } from '../../../../redux/reducers/modalReducer';
import { LABEL_TO_SYSTEM_LABEL } from '../../../../utils/label';
import { useSystemLabel, useOpenCmdPaletteHandler, useWrapActionHandler } from '../GlobalHotKeys.hooks';

import { SingleKeyActions, SINGLE_KEY_MAP } from './SingleKeyHotKeys.constants';

configure({
  ignoreEventsCondition: () => false,
  stopEventPropagationAfterHandling: false
});

const SingleKeyHotKeys = () => {
  // Redux
  const dispatch = useDispatch();
  const { composeOpen, composeCollapseState } = useAppSelector((state) => state.modal);
  const { hoveredThreadIndex, hoveredThreadID, selectedThreadIDs, renderedMailboxThreadsCount } = useAppSelector(
    (state) => state.mailbox
  );

  // Custom hooks
  const [threadFormat, setThreadFormat] = useUserPreference(StorageTypes.THREAD_FORMAT);
  const { reply, replyAll, forward } = useActiveThreadActions();
  const { archiveThreads, moveThreads, setActiveThreadID, activeThreadID } = useThreadActions();
  const { systemLabel, isDrafts, isTrashOrArchive } = useSystemLabel();
  const effectiveThreadIDs = useGetEffectiveThreadIDs();
  const openCmdPaletteHandler = useOpenCmdPaletteHandler();
  const wrapActionHandler = useWrapActionHandler(true);

  const isComposeCollapsed = composeCollapseState === ComposeExpandTypes.Collapsed;
  const lastRenderedThreadIndex = renderedMailboxThreadsCount - 1;

  const scrollToHoveredThread = () => {
    const threadElement = document.getElementById(hoveredThreadID);
    threadElement?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  };

  // Archive threads
  const archiveHandler = useCallback(
    (e?: KeyboardEvent) => {
      if (isTrashOrArchive || isDrafts || !effectiveThreadIDs.length) return;

      onHandleHotKeyPress(e);
      void archiveThreads(effectiveThreadIDs);
    },
    [isTrashOrArchive, isDrafts, effectiveThreadIDs, archiveThreads]
  );

  // Down arrow
  // Navigates through threads in the mailbox
  const downArrowHandler = (e?: KeyboardEvent) => {
    onHandleHotKeyPress(e);
    const nextThreadIndex = hoveredThreadIndex === lastRenderedThreadIndex ? 0 : hoveredThreadIndex + 1;
    dispatch(skemailMailboxReducer.actions.setHoveredThreadIndex({ hoveredThreadIndex: nextThreadIndex }));
    scrollToHoveredThread();
  };

  // Opens thread details
  const enterHandler = useCallback(
    (e?: KeyboardEvent) => {
      // only change if hoveredThreadID exists (this prevents thread being reset on navigation)
      // and thus prevents a bug where notification do not open thread
      if (!hoveredThreadID) return;

      onHandleHotKeyPress(e);
      setActiveThreadID({ threadID: hoveredThreadID });
      dispatch(skemailModalReducer.actions.collapse());
    },
    [hoveredThreadID, setActiveThreadID, dispatch]
  );

  // Collapses compose
  const escapeHandler = useCallback(
    (e?: KeyboardEvent) => {
      // Do nothing if neither the compose window nor a thread is open
      if (isComposeCollapsed && !activeThreadID) return;

      onHandleHotKeyPress(e);
      // if compose is open - collapse
      if (!isComposeCollapsed) {
        dispatch(skemailModalReducer.actions.collapse());
        return;
      }

      setActiveThreadID(undefined);
    },
    [activeThreadID, isComposeCollapsed, dispatch, setActiveThreadID]
  );

  // Opens the forward compose
  const forwardHandler = useCallback(
    (e?: KeyboardEvent) => {
      // Do nothing if there is no active thread
      if (!activeThreadID) return;

      onHandleHotKeyPress(e);
      forward();
    },
    [activeThreadID, forward]
  );

  // Selects thread
  const selectHandler = useCallback(
    (e?: KeyboardEvent) => {
      onHandleHotKeyPress(e);
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

  // Opens compose
  const openComposeHandler = useCallback(
    (e: KeyboardEvent | undefined) => {
      // ignore if meta+c / ctrl+c
      if (e?.metaKey || e?.ctrlKey) return;
      if (composeOpen && !isComposeCollapsed) return;

      onHandleHotKeyPress(e);
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

  // Opens the label dropdown for selected threads
  const openLabelsMenuHandler = (e?: KeyboardEvent) => {
    // Do nothing if there are no selected threads and no active thread
    if (!selectedThreadIDs.length && !activeThreadID) return;

    onHandleHotKeyPress(e);
    // Open mailbox label dropdown for selected threads
    if (selectedThreadIDs.length) {
      dispatch(skemailHotKeysReducer.actions.setMailboxLabelsDropdownOpen());
      return;
    }

    // Open active thread labels dropdown
    dispatch(skemailHotKeysReducer.actions.setActiveThreadLabelMenuOpen());
  };

  // Opens reply compose
  const replyHandler = useCallback(
    (e?: KeyboardEvent) => {
      // Do nothing if there is no active thread
      if (!activeThreadID) return;

      onHandleHotKeyPress(e);
      reply();
    },
    [activeThreadID, reply]
  );

  // Opens reply all compose
  const replyAllHandler = useCallback(
    (e?: KeyboardEvent) => {
      // Do nothing if there is no active thread
      if (!activeThreadID) return;

      onHandleHotKeyPress(e);
      replyAll();
    },
    [activeThreadID, replyAll]
  );

  // change format between split and full
  const threadFormatHandler = useCallback(
    (e?: KeyboardEvent) => {
      onHandleHotKeyPress(e);

      // act like a toggle, if threadFormat is full, set it to right and vice versa
      setThreadFormat(threadFormat === ThreadDisplayFormat.Full ? ThreadDisplayFormat.Right : ThreadDisplayFormat.Full);
    },
    [threadFormat, setThreadFormat]
  );

  // Undoes trash or archive
  const undoHandler = useCallback(
    (e?: KeyboardEvent) => {
      if (!isTrashOrArchive || !effectiveThreadIDs.length) return;

      onHandleHotKeyPress(e);
      void moveThreads(effectiveThreadIDs, LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox], [systemLabel]);
    },
    [isTrashOrArchive, effectiveThreadIDs, moveThreads, systemLabel]
  );

  // Up arrow
  // Navigates through threads in the mailbox
  const upArrowHandler = (e?: KeyboardEvent) => {
    onHandleHotKeyPress(e);
    const prevThreadIndex = Math.max(0, hoveredThreadIndex === 0 ? lastRenderedThreadIndex : hoveredThreadIndex - 1);
    dispatch(skemailMailboxReducer.actions.setHoveredThreadIndex({ hoveredThreadIndex: prevThreadIndex }));
    scrollToHoveredThread();
  };

  const singleKeyHandlers: HotKeyHandlers<typeof SINGLE_KEY_MAP> = {
    [SingleKeyActions.ARCHIVE]: wrapActionHandler(archiveHandler),
    [SingleKeyActions.DOWN_ARROW]: wrapActionHandler(downArrowHandler),
    [SingleKeyActions.ENTER]: wrapActionHandler(enterHandler),
    // We enable the esc handler when the user is composing an email
    // in case they want to collapse the Compose window
    [SingleKeyActions.ESCAPE]: wrapActionHandler(escapeHandler, true),
    [SingleKeyActions.FORWARD]: wrapActionHandler(forwardHandler),
    [SingleKeyActions.LABELS_MENU]: wrapActionHandler(openLabelsMenuHandler),
    [SingleKeyActions.OPEN_COMPOSE]: wrapActionHandler(openComposeHandler),
    [SingleKeyActions.OPEN_COMMAND_PALETTE]: wrapActionHandler(openCmdPaletteHandler),
    [SingleKeyActions.REPLY]: wrapActionHandler(replyHandler),
    [SingleKeyActions.REPLY_ALL]: wrapActionHandler(replyAllHandler),
    [SingleKeyActions.SELECT_THREAD]: wrapActionHandler(selectHandler),
    [SingleKeyActions.THREAD_FORMAT]: wrapActionHandler(threadFormatHandler),
    [SingleKeyActions.UNDO]: wrapActionHandler(undoHandler),
    [SingleKeyActions.UP_ARROW]: wrapActionHandler(upArrowHandler)
  };

  return <GlobalHotKeys allowChanges handlers={singleKeyHandlers} keyMap={SINGLE_KEY_MAP} />;
};

export default SingleKeyHotKeys;
