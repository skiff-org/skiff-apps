import { useEffect, useRef } from 'react';

// The area on the left side of the screen where it is possible to go back by swipe
const ALLOWES_LEFT_AREA = 20;

// This hook add ability to swipe back to previous screen
export const useSwipeBack = (
  screenId: string | null, // Active screen id
  previousScreenId: string, // Previous screen id
  onComplete: () => void, // cb to be excute when progress complete
  classToIgnore?: string[], // Array of class names that will be ignored if the touches comes from traget that has them
  onProgressChange?: (
    // cb that be called for every progress change
    // Return true if you want to ignore default effect
    progress: string,
    transition: string,
    activeScreen: HTMLDivElement,
    previousScreen: HTMLDivElement
  ) => boolean
) => {
  const progress = useRef<number>(0);
  const lastX = useRef<number>(0);
  const activeSwipe = useRef<boolean>(false);
  const activeScreenRef = useRef<HTMLDivElement | null>(null);
  const previousScreenRef = useRef<HTMLDivElement | null>(null);

  if (!screenId) {
    return;
  }

  function handleTouchStart(e: any) {
    lastX.current = e.targetTouches[0].clientX;
    activeSwipe.current = lastX.current < ALLOWES_LEFT_AREA && !progress.current;
    progress.current = 0;
  }

  const getScreensFromCache = () => {
    if (
      !activeScreenRef.current ||
      !previousScreenRef.current ||
      !activeScreenRef.current.isConnected ||
      !previousScreenRef.current.isConnected
    ) {
      activeScreenRef.current = document.getElementById(screenId) as HTMLDivElement;
      previousScreenRef.current = document.getElementById(previousScreenId) as HTMLDivElement;
    }
    return [activeScreenRef.current, previousScreenRef.current];
  };

  const changeProgress = (threadProgress: string, transition?: string) => {
    const [activeScreen, previousScreen] = getScreensFromCache();
    let ignoreDefault = false;

    if (onProgressChange) {
      ignoreDefault = onProgressChange(threadProgress, transition || '', activeScreen, previousScreen);
    }
    if (!ignoreDefault) {
      // Default ios behaviur
      if (transition) {
        activeScreen.style.transition = `transform ${transition} ease-in-out`;
        previousScreen.style.transition = `transform ${transition} ease-in-out`;
      }

      previousScreen.style.transform = `translateX(calc(-43px * (1 - ${threadProgress})))`;
      activeScreen.style.transform = `translateX(calc(100vw * ${threadProgress}))`;
    }
  };

  function handleTouchMove(e: any) {
    if (!activeSwipe.current) {
      return;
    }
    const { clientX, target } = e.targetTouches[0];
    if (clientX < ALLOWES_LEFT_AREA && !progress.current) {
      return;
    }
    progress.current = clientX / screen.width;
    if (!classToIgnore || !classToIgnore.find((className) => target.className.includes(className))) {
      changeProgress(`${progress.current}`, `0s`);
    }

    e.stopPropagation();
    e.preventDefault();
  }

  const handleTouchEnd = (e: any) => {
    if (!activeSwipe.current) {
      return;
    }
    const { clientX } = e.changedTouches[0];

    if (clientX > screen.width / 2) {
      changeProgress('1', `0.2s`);
      onComplete();
      e.stopPropagation();
      e.preventDefault();
      return;
    } else {
      changeProgress('0', `0.2s`);
    }
    progress.current = 0; // reseting for consecutive swipes
  };

  useEffect(() => {
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchstart', handleTouchStart);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return {
    changeProgress
  };
};
