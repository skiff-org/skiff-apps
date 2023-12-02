import { MutableRefObject, RefObject, useCallback, useEffect, useRef } from 'react';

import {
  SCRIM_CLASSNAME,
  OPTION_MENU_CLASSNAME,
  ENABLE_OUTSIDE_CLICKS_CLASSNAME,
  CONFIRM_MODAL_CLASSNAME
} from '../components/Surface/Surface.constants';
import { MOUSE_SAFE_AREA_CLASSNAME } from '../constants';
import { MouseClickEvents, MouseEvents, TouchEvents } from '../types';

/**
 * calls the handler when there is click outside the ref
 */
export function useOnClickOutside(
  ref: RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void,
  excludedClasses?: string[],
  events?: { web?: MouseClickEvents; mobile?: TouchEvents },
  excludedRefs?: (MutableRefObject<HTMLDivElement | null> | undefined)[],
  // disables the hook on condition
  disable?: boolean,
  /** The max number of pixels the mouse can move between the `mousedown` and the `mouseup` events. If exceeded will not call the handler */
  clickMaxOffset?: number
) {
  const mouseDownCoordsRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const onClickOutside = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!ref?.current) return;
      // if listening to click events and the mouse crossed `clickMaxOffset` - don't call the handler
      if (events?.web === MouseEvents.CLICK && clickMaxOffset !== undefined) {
        const xDiff = Math.abs((event as MouseEvent).clientX - mouseDownCoordsRef.current.x);
        const yDiff = Math.abs((event as MouseEvent).clientY - mouseDownCoordsRef.current.y);

        if (xDiff > clickMaxOffset || yDiff > clickMaxOffset) return;
      }

      const eventTarget = event.target as HTMLElement;

      // do nothing on clicking ref's element or descendent elements
      // or if the eventTarget is not longer being rendered
      if (ref.current.contains(eventTarget) || !document.contains(eventTarget)) return;

      // in cases where a top-level modal is portal'd in with a scrim, we can't rely on ordinary descendent checks; we instead
      // confirm a listening modal is at the top level by ensuring it is contained in the clicked-on scrim element and handle offclicks only in this case
      if (eventTarget.classList.contains(SCRIM_CLASSNAME) && !eventTarget.contains(ref.current)) return;

      // in general, we do nothing on clicking any of the excluded classes or refs
      // for dropdowns, we only exclude clicks on other dropdowns, which may be sub or parent menus
      const isExcludedClass = excludedClasses?.find((currClass) => eventTarget.closest(`.${currClass}`));
      const isExcludedRef = excludedRefs?.find((currRef) => currRef?.current?.contains(eventTarget));

      const targetEnabledOutsideClicks = !!eventTarget.closest(`.${ENABLE_OUTSIDE_CLICKS_CLASSNAME}`);
      const targetIsConfirmModal = !!eventTarget.closest(`.${CONFIRM_MODAL_CLASSNAME}`);

      const refIsOptionMenu = ref.current.classList.contains(OPTION_MENU_CLASSNAME);
      const targetIsOptionMenu = !!eventTarget.closest(`.${OPTION_MENU_CLASSNAME}`);

      // safe areas have their associated submenu as a next sibling
      const clickedOnUnrelatedSafeArea =
        eventTarget.classList.contains(MOUSE_SAFE_AREA_CLASSNAME) && eventTarget.nextSibling !== ref.current;
      if (
        isExcludedRef ||
        (!refIsOptionMenu && isExcludedClass) ||
        (refIsOptionMenu && targetIsOptionMenu && !targetEnabledOutsideClicks) ||
        clickedOnUnrelatedSafeArea ||
        targetIsConfirmModal
      )
        return;
      // otherwise, handle clicking outside
      const touchEvent = event as TouchEvent;

      // Should only occur on touch events since they are passive by default
      const isTouchStart = touchEvent.type === TouchEvents.TOUCH_START;

      if (isTouchStart) {
        touchEvent.preventDefault();
      }
      if (handler) handler(isTouchStart ? touchEvent : (event as MouseEvent));
    },
    [ref, events?.web, clickMaxOffset, excludedClasses, excludedRefs, handler]
  );

  useEffect(() => {
    const updateMouseDownStart = (e: MouseEvent) => {
      mouseDownCoordsRef.current = { x: e.clientX, y: e.clientY };
    };

    if (events?.web === MouseEvents.CLICK && clickMaxOffset !== undefined) {
      document.addEventListener(MouseEvents.MOUSE_DOWN, updateMouseDownStart);
    }

    return () => document.removeEventListener(MouseEvents.MOUSE_DOWN, updateMouseDownStart);
  }, [clickMaxOffset, events?.web]);

  useEffect(() => {
    if (disable) return; // disables the hook
    document.addEventListener(events?.web || MouseEvents.MOUSE_DOWN, onClickOutside);
    document.addEventListener(events?.mobile || TouchEvents.TOUCH_START, onClickOutside, { passive: false });
    return () => {
      if (disable) return; // disables the hook
      document.removeEventListener(events?.web || MouseEvents.MOUSE_DOWN, onClickOutside);
      document.removeEventListener(events?.mobile || TouchEvents.TOUCH_START, onClickOutside);
    };
  }, [events?.mobile, events?.web, onClickOutside, disable]);
}
