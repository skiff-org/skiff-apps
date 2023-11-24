import { useCallback } from 'react';
import { configure, GlobalHotKeys } from 'react-hotkeys';
import { HotKeyHandlers, onHandleHotKeyPress, TabPage } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';

import { useAppSelector } from '../../../../hooks/redux/useAppSelector';
import { useActiveThreadActions } from '../../../../hooks/useActiveThreadActions';
import { useAvailableUserLabels } from '../../../../hooks/useAvailableLabels';
import { useGetEffectiveThreadIDs } from '../../../../hooks/useGetEffectiveThreadIDs';
import { useThreadActions } from '../../../../hooks/useThreadActions';
import { isPlainLabel, LABEL_TO_SYSTEM_LABEL } from '../../../../utils/label';
import { useSettings } from '../../../Settings/useSettings';
import {
  useGoToMailboxHandler,
  useSystemLabel,
  useOpenCmdPaletteHandler,
  useWrapActionHandler
} from '../GlobalHotKeys.hooks';

import { SINGLE_COMBINATION_KEY_MAP, SingleCombinationKeyActions } from './SingleCombinationHotKeys.constants';

configure({
  ignoreEventsCondition: () => false,
  stopEventPropagationAfterHandling: false
});

const SingleCombinationHotKeys = () => {
  // Redux
  const { selectedThreadIDs } = useAppSelector((state) => state.mailbox);

  // Custom hooks
  const { openSettings } = useSettings();
  const { activeThreadLabels } = useActiveThreadActions();
  const { moveThreads, trashThreads, removeUserLabel, activeThreadID } = useThreadActions();
  const { existingLabels: selectedThreadsLabels } = useAvailableUserLabels();
  const { systemLabel, isDrafts, isSpam, isTrashOrArchive } = useSystemLabel();
  const effectiveThreadIDs = useGetEffectiveThreadIDs();
  const goToMailboxHandler = useGoToMailboxHandler();
  const openCmdPaletteHandler = useOpenCmdPaletteHandler();
  const wrapActionHandler = useWrapActionHandler();

  // Opens settings modal
  const openSettingsHandler = (e?: KeyboardEvent) => {
    onHandleHotKeyPress(e);
    openSettings({ tab: TabPage.Account });
  };

  // Removes all user labels
  const removeAllUserLabelsHandler = (e?: KeyboardEvent) => {
    onHandleHotKeyPress(e);
    if (selectedThreadIDs.length) {
      void removeUserLabel(selectedThreadIDs, selectedThreadsLabels.filter(isPlainLabel));
    } else if (activeThreadID) {
      void removeUserLabel([activeThreadID], activeThreadLabels);
    }
  };

  // Trashes threads
  const trashHandler = useCallback(
    (e?: KeyboardEvent) => {
      if (isTrashOrArchive || !effectiveThreadIDs.length) return;

      onHandleHotKeyPress(e);
      void trashThreads(effectiveThreadIDs, isDrafts, undefined, systemLabel);
    },
    [isTrashOrArchive, effectiveThreadIDs, trashThreads, isDrafts, systemLabel]
  );

  const markSpamHandler = useCallback(
    (e?: KeyboardEvent) => {
      if (isSpam || !effectiveThreadIDs.length) return;

      onHandleHotKeyPress(e);
      void moveThreads(effectiveThreadIDs, LABEL_TO_SYSTEM_LABEL[SystemLabels.Spam], [systemLabel]);
    },
    [isSpam, effectiveThreadIDs, moveThreads, systemLabel]
  );

  const singleCombinationHandlers: HotKeyHandlers<typeof SINGLE_COMBINATION_KEY_MAP> = {
    [SingleCombinationKeyActions.GO_TO_MAILBOX]: wrapActionHandler(goToMailboxHandler),
    [SingleCombinationKeyActions.OPEN_COMMAND_PALETTE]: wrapActionHandler(openCmdPaletteHandler),
    [SingleCombinationKeyActions.OPEN_SETTINGS]: wrapActionHandler(openSettingsHandler),
    [SingleCombinationKeyActions.REMOVE_ALL_LABELS]: wrapActionHandler(removeAllUserLabelsHandler),
    [SingleCombinationKeyActions.TRASH]: wrapActionHandler(trashHandler),
    [SingleCombinationKeyActions.MARK_SPAM]: wrapActionHandler(markSpamHandler)
  };

  return <GlobalHotKeys allowChanges handlers={singleCombinationHandlers} keyMap={SINGLE_COMBINATION_KEY_MAP} />;
};

export default SingleCombinationHotKeys;
