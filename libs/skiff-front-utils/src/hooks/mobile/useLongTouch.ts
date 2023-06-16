import { RefObject, useCallback, useEffect, useRef } from 'react';
import { isMobile } from 'react-device-detect';

type Timeout = ReturnType<typeof setTimeout>;

enum EventTypes {
  MouseDown = 'mousedown',
  MouseUp = 'mouseup',
  MouseMove = 'mousemove',
  TouchStart = 'touchstart',
  TouchEnd = 'touchend',
  TouchMove = 'touchmove'
}

export const isTouchEvent = (e: MouseEvent | TouchEvent): e is TouchEvent => !!(e as TouchEvent).touches;

/**
 * Hook for long touch events.
 * @param targetRef ref to listen for touch events
 * @param onLongTouch callback, called when long touch is detected
 * @param duration the duration of the long touch
 * @param ignoreMove do not cancel long touch when moved and disable scroll
 * @param passive should event handler be passive
 */
export const useLongTouch = (
  targetRef: RefObject<HTMLElement>,
  onLongTouch: (e: MouseEvent | TouchEvent) => void,
  duration = 500,
  ignoreMove = false,
  passive = true
) => {
  const timerRef = useRef<Timeout | false>(false);
  const timer = timerRef.current;

  const setTimer = (value: Timeout | false) => {
    timerRef.current = value;
  };

  const clearTimer = (_timer: Timeout) => {
    clearTimeout(_timer);
    setTimer(false);
  };

  const handleTouchEnd = () => {
    const currentTimer = timerRef.current;
    if (currentTimer) {
      clearTimer(currentTimer);
    }
  };

  const preventScroll = useCallback((e: TouchEvent) => {
    e.preventDefault();
  }, []);

  const unPreventScroll = useCallback((e: TouchEvent) => {
    if (e.target && e.target instanceof HTMLElement) {
      e.target.removeEventListener(EventTypes.TouchMove, preventScroll);
      e.target.removeEventListener(EventTypes.TouchEnd, unPreventScroll);
    }
  }, []);

  const handleTouchStart = (e: MouseEvent | TouchEvent) => {
    if (ignoreMove && !passive) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isMobile && !ignoreMove) {
      targetRef.current?.removeEventListener(EventTypes.TouchMove, preventScroll);
    }
    setTimer(
      setTimeout(() => {
        if (isMobile && !ignoreMove) {
          // Prevent scroll when moving
          targetRef.current?.addEventListener(EventTypes.TouchMove, preventScroll);
        }
        onLongTouch(e);
      }, duration)
    );
  };

  useEffect(() => {
    if (!targetRef.current) return;

    const elem = targetRef.current;

    if (isMobile) {
      elem.addEventListener(EventTypes.TouchStart, handleTouchStart, { passive });
      elem.addEventListener(EventTypes.TouchEnd, handleTouchEnd, { passive });
      if (!ignoreMove) {
        elem.addEventListener(EventTypes.TouchMove, handleTouchEnd);
        elem.addEventListener(EventTypes.TouchEnd, unPreventScroll);
      }
    } else {
      elem.addEventListener(EventTypes.MouseDown, handleTouchStart, { passive });
      elem.addEventListener(EventTypes.MouseUp, handleTouchEnd, { passive });
      if (!ignoreMove) elem.addEventListener(EventTypes.MouseMove, handleTouchEnd, { passive });
    }

    // Cleanup
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      if (!elem) return;

      if (isMobile) {
        elem.removeEventListener(EventTypes.TouchStart, handleTouchStart);
        elem.removeEventListener(EventTypes.TouchEnd, handleTouchEnd);
        if (!ignoreMove) {
          elem.removeEventListener(EventTypes.TouchMove, preventScroll);
          elem.removeEventListener(EventTypes.TouchMove, handleTouchEnd);
          elem.removeEventListener(EventTypes.TouchEnd, unPreventScroll);
        }
      } else {
        elem.removeEventListener(EventTypes.MouseDown, handleTouchStart);
        elem.removeEventListener(EventTypes.MouseUp, handleTouchEnd);
        if (!ignoreMove) elem.removeEventListener(EventTypes.MouseMove, handleTouchEnd);
      }
    };
  }, [targetRef.current]);
};
