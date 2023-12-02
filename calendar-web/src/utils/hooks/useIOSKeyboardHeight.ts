import { useEffect, useState } from 'react';

/**
 * Get height of mobile keyboard
 * @param id custom unique id
 * @returns height of mobile keyboard
 */
export const useIosKeyboardHeight = (id: string) => {
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    window.rnIosKeyboardCbs = window.rnIosKeyboardCbs || {};
    window.rnIosKeyboardCbs[id] = (newHeight: number) => {
      setHeight(newHeight);
    };
  }, []);

  return height;
};
