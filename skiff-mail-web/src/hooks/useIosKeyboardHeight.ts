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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    window.rnIosKeyboardCbs = window.rnIosKeyboardCbs || {};
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    window.rnIosKeyboardCbs[id] = (newHeight: number) => {
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
