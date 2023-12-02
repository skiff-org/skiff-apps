import { useCallback } from 'react';

import { useAppSelector } from './useAppSelector';

export const useScrollToSelectedEvent = () => {
  const { selectedEventID, isSelectedEventLastDisplayed } = useAppSelector((state) => state.event);

  const selectedEventElement = document.getElementById(
    `${selectedEventID ?? ''}${isSelectedEventLastDisplayed ? '_last' : ''}`
  );

  const scrollToSelectedEvent = useCallback(() => {
    if (!selectedEventID) return;

    const selectedEventRect = selectedEventElement?.getBoundingClientRect();

    // Scroll into view only if needed
    const { top: selectedEventTop = 0, bottom: selectedEventBottom = 0 } = selectedEventRect || {};
    const isWithinView = selectedEventTop > 0 && selectedEventBottom < window.innerHeight;
    if (isWithinView || selectedEventElement === null) return;

    selectedEventElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selectedEventID, selectedEventElement]);

  return scrollToSelectedEvent;
};
