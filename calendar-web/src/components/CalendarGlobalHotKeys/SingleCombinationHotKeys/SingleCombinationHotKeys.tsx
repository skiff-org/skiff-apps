import React, { useCallback } from 'react';
import { GlobalHotKeys, configure } from 'react-hotkeys';
import { HotKeyHandlers, TabPage, onHandleHotKeyPress } from 'skiff-front-utils';

import { useOpenSettings } from '../../CalendarSettings/useOpenCloseSettings';
import { useWrapActionHandler } from '../CalendarGlobalHotKeys.hooks';

import { SINGLE_COMBINATION_KEY_MAP, SingleCombinationActions } from './SingleCombinationHotKeys.constants';

configure({
  ignoreEventsCondition: () => false,
  stopEventPropagationAfterHandling: false
});

const SingleKeyHotKeys = () => {
  const openSettings = useOpenSettings();
  const wrapActionHandler = useWrapActionHandler();

  // Opens settings modal
  const openSettingsHandler = useCallback(
    (e?: KeyboardEvent) => {
      onHandleHotKeyPress(e);
      openSettings({ indices: { tab: TabPage.Format } });
    },
    [openSettings]
  );

  const singleCombinationHandlers: HotKeyHandlers<typeof SINGLE_COMBINATION_KEY_MAP> = {
    [SingleCombinationActions.OPEN_SETTINGS]: wrapActionHandler(openSettingsHandler)
  };

  return (
    <GlobalHotKeys
      allowChanges // Permits the handlers to change after the component mounts
      handlers={singleCombinationHandlers}
      keyMap={SINGLE_COMBINATION_KEY_MAP}
    />
  );
};

export default SingleKeyHotKeys;
