import React from 'react';
import { GlobalHotKeys, configure } from 'react-hotkeys';
import { HotKeyHandlers } from 'skiff-front-utils';

import { useGoToMailboxHandler, useWrapActionHandler } from '../GlobalHotKeys.hooks';

import { MULTI_COMBINATION_KEY_MAP, MultiCombinationKeyActions } from './MultiCombinationHotKeys.constants';

configure({
  ignoreEventsCondition: () => false,
  stopEventPropagationAfterHandling: false
});

const GlobalHotkeys = () => {
  const goToMailboxHandler = useGoToMailboxHandler();
  const wrapActionHandler = useWrapActionHandler();

  const multiCombinationHandlers: HotKeyHandlers<typeof MULTI_COMBINATION_KEY_MAP> = {
    [MultiCombinationKeyActions.GO_TO_MAILBOX]: wrapActionHandler(goToMailboxHandler)
  };

  return (
    <GlobalHotKeys
      allowChanges // Permits the handlers to change after the component mounts
      handlers={multiCombinationHandlers}
      keyMap={MULTI_COMBINATION_KEY_MAP}
    />
  );
};

export default GlobalHotkeys;
