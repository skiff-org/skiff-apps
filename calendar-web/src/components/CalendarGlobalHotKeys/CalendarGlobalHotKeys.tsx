import React from 'react';
import { configure } from 'react-hotkeys';

import SingleCombinationHotKeys from './SingleCombinationHotKeys';
import SingleKeyHotKeys from './SingleKeyHotKeys';

configure({
  ignoreEventsCondition: () => false,
  stopEventPropagationAfterHandling: false
});

const CalendarGlobalHotkeys = () => {
  return (
    <>
      {/**
       * Multi-key handlers should come before single key handlers
       * since key combinations need to be checked before single keys are checked
       */}
      <SingleCombinationHotKeys />
      <SingleKeyHotKeys />
    </>
  );
};

export default CalendarGlobalHotkeys;
