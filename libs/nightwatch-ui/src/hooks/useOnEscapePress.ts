import { useEffect, useCallback, RefObject } from 'react';

import { KeyboardEvents } from '../types';

/**
 * This hook handles escape key presses on the last element present in the
 * DOM that meets a given selector criteria (e.g. classname). It can be used
 * to, for example, close the top-most Surface component on an escape key press.
 * @param {RefObject<HTMLElement>} listeningRef - The ref for the component that should listen for escape presses.
 * @param {string} selector - The selector by which to find elements that may be simultaneously listening.
 * @param {function} handler - The handler called on qualified escape presses.
 */

export const useOnEscapePress = (listeningRef: RefObject<HTMLElement>, selector: string, handler: () => void) => {
  const handleEsc = useCallback(
    (event: KeyboardEvent) => {
      const elemsPresent = Array.from(document.querySelectorAll(selector));
      if (!elemsPresent.length || !listeningRef.current) return;
      // the last element that meets selector criteria by document order
      const lastElem = elemsPresent[elemsPresent.length - 1];
      if (event.key === 'Escape' && listeningRef.current.isSameNode(lastElem)) {
        handler();
      }
    },
    [handler, listeningRef, selector]
  );

  useEffect(() => {
    document.addEventListener(KeyboardEvents.KEY_UP, handleEsc);
    return () => {
      document.removeEventListener(KeyboardEvents.KEY_UP, handleEsc);
    };
  }, [handleEsc]);
};
