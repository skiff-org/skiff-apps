import { useCallback, useEffect, useState } from 'react';

import { KeyboardEvents, MouseEvents } from '../types';

export type KeyboardNavControls = {
  // Current highlighted index
  idx: number;
  // Number of items being navigated
  numItems: number;
  // Updates the highlighted index
  setIdx: (idx: number) => void;
};

/**
 * Handles up and down keyboard navigation
 * @param disabled - Disables keyboard navigation
 * @param keyboardNavControls - An object containing all the necessary attributes for keyboard navigation
 */
export const useKeyboardNavigation = (disabled: boolean, keyboardNavControls?: KeyboardNavControls) => {
  // State indicating whether keyboard navigation is active
  const [isNavigating, setIsNavigating] = useState(false);
  const { idx = 0, numItems = 0, setIdx = () => {} } = keyboardNavControls || {};
  // Whether or not keyboard nav is currently active
  const isActive = !disabled && !!keyboardNavControls;

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent | KeyboardEvent) => {
      const key = event.key;
      // Do nothing if none of DownArrow key, the UpArrow key or the Enter key were pressed
      // or if Enter was pressed and no Enter handler was passed
      if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Tab') return;

      event.preventDefault();
      event.stopPropagation();

      if (!isNavigating) setIsNavigating(true);

      if (key === 'Tab') {
        // Loop back
        if (idx === numItems - 1) setIdx(0);
        else setIdx(idx + 1);
      } else if (key === 'ArrowDown') {
        // Navigation should stop at the end of the list when using arrow keys
        if (idx === numItems - 1) return;
        setIdx(idx + 1);
      } else if (key === 'ArrowUp') {
        // Navigation should stop at the start of the list when using arrow keys
        if (idx === 0) return;
        setIdx(idx - 1);
      }
    },
    [idx, setIdx, isNavigating, numItems]
  );

  const onMouseMove = useCallback(() => {
    if (isNavigating) setIsNavigating(false);
  }, [isNavigating]);

  useEffect(() => {
    if (!isActive) return;

    window.addEventListener(KeyboardEvents.KEY_DOWN, onKeyDown);
    window.addEventListener(MouseEvents.MOUSE_MOVE, onMouseMove);
    return () => {
      window.removeEventListener(KeyboardEvents.KEY_DOWN, onKeyDown);
      window.removeEventListener(MouseEvents.MOUSE_MOVE, onMouseMove);
    };
  }, [isActive, onKeyDown, onMouseMove]);

  // Makes sure that the highlighted index is always within the number of dropdown items
  // in case the number of dropdown items changes (eg. due to filtering)
  // This ensures that there would always be one highlighted item
  useEffect(() => {
    if (!isActive) return;
    if (idx === -1 && !!numItems) setIdx(0);
    else if (idx > numItems - 1) setIdx(numItems - 1);
  }, [isActive, idx, numItems, setIdx]);

  // Reset index
  useEffect(() => {
    if (disabled && !!keyboardNavControls) setIdx(0);
  }, [disabled, keyboardNavControls, setIdx]);

  return isNavigating;
};
