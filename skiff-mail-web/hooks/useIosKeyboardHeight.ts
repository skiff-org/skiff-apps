import { useEffect, useState } from 'react';

import { BOTTOM_NAVIGATION_HEIGHT } from '../components/mailbox/consts';

/**
 * Get height of mobile keyboard
 * @param id custom unique id
 * @param bottomNavOffset
 * @returns height of mobile keyboard
 */
export const useIosKeyboardHeight = (id: string, bottomNavOffset?: boolean) => {
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    window.rnIosKeyboardCbs = window.rnIosKeyboardCbs || {};
    window.rnIosKeyboardCbs[id] = (newHeight) => {
      let calcHeight = newHeight;
      if (bottomNavOffset && calcHeight) {
        calcHeight = calcHeight - BOTTOM_NAVIGATION_HEIGHT;
      }
      setHeight(calcHeight);
    };

    if (window.lastIosKeyboardHeight) {
      setHeight(window.lastIosKeyboardHeight);
    }
  }, []);

  return height;
};
