import React from 'react';

import MultiCombinationHotKeys from './MultiCombinationHotKeys';
import SingleCombinationHotKeys from './SingleCombinationHotKeys';
import SingleKeyHotKeys from './SingleKeyHotKeys';

// Key combinations vs sequences: https://github.com/greena13/react-hotkeys/blob/master/README.md#key-combinations-vs-sequences
const GlobalHotkeys = () => {
  return (
    <>
      {/**
       * Multi-key handlers should come before single key handlers
       * since key combinations need to be checked before single keys are checked
       */}
      <MultiCombinationHotKeys />
      <SingleCombinationHotKeys />
      <SingleKeyHotKeys />
    </>
  );
};

export default GlobalHotkeys;
