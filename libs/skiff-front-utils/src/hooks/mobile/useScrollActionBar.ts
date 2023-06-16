import { useRef, useState, useEffect } from 'react';
import { isMobile } from 'react-device-detect';

declare global {
  interface Window {
    ReactNativeWebView: any;
    touchesCb: any;
    IsSkiffWindowsDesktop: boolean;
  }
}

const isMobileApp = () => isMobile && !!window.ReactNativeWebView;
const DISTANCE_THRESHOLD = 3;

export const useScrollActionBar = (actionBarHeight: number, id: string) => {
  const lastScrollPos = useRef(0);
  // Status of header (Show/hidden)
  const headerVisibility = useRef<boolean>(true);
  // Needed for knowing when the virualized list is ready and the scrollArea ref is not null
  const [outerRef, setOuterRef] = useState<HTMLDivElement | null>(null);
  const actionbarEl = document.getElementById(id);

  const animateActionbar = (progress: string, transition?: string) => {
    if (!actionbarEl || !actionbarEl.isConnected) {
      return;
    }
    actionbarEl.style.transform = `translateY(calc((1 - ${progress}) * -${actionBarHeight}px))`;
    actionbarEl.style.opacity = progress;
    if (transition) {
      actionbarEl.style.transition = `transform ${transition}, opacity ${transition}`;
    }
  };

  useEffect(() => {
    const currentRef = outerRef;
    if (!currentRef || !isMobile) {
      return;
    }

    let touchLeadsToScroll = false;
    let disableScrollEvent = false;
    const touchstart = () => {
      touchLeadsToScroll = false;
      disableScrollEvent = false;

      lastScrollPos.current = lastScrollPos.current;
    };

    const touchend = () => {
      if (!touchLeadsToScroll || !currentRef) {
        // We are using the touchstart from the RN side (because of an issue with ios detailed below) we want to verify touch trigger scroll change on list
        return;
      }
      // On touchend round the progress and by that close/open the header/bottomNav
      const currentScrollTop = currentRef.scrollTop;
      if (!headerVisibility.current && currentScrollTop > 0 && currentScrollTop <= actionBarHeight) {
        // In case of close on touchend scroll the mail list
        disableScrollEvent = true;
        currentRef.scrollTo({
          top: actionBarHeight,
          behavior: 'smooth'
        });
      }
    };

    const scroll = () => {
      if (!currentRef) {
        return;
      }

      touchLeadsToScroll = true;
      if (!currentRef) return;
      const scrollTop = currentRef.scrollTop;
      const shouldShow = scrollTop < lastScrollPos.current - DISTANCE_THRESHOLD; // DOWN
      const shouldHide = scrollTop > lastScrollPos.current + DISTANCE_THRESHOLD; // UP
      lastScrollPos.current = scrollTop;
      // Ignore if distance does not pass threshold or at top
      if (shouldHide) {
        if (scrollTop <= 0) return;
        animateActionbar('0', '0.2s');
        headerVisibility.current = false;
      } else if (shouldShow && !disableScrollEvent) {
        animateActionbar('1', '0.2s');
        headerVisibility.current = true;
      }

      window.touchesCb = window.touchesCb || {};
      window.touchesCb.actionBarScroll = (event: string) => {
        // We are using the "native" onTouchStart/end beacouse on iOS when user start touch while scroll those event not called
        if (event === 'start') {
          touchstart();
        } else if (event === 'end') {
          touchend();
        }
      };
    };

    currentRef.addEventListener('scroll', scroll);

    if (!isMobileApp()) {
      // Since web doesn't have native events, use browser events as it's better than nothing
      window.addEventListener('touchstart', touchstart);
      window.addEventListener('touchend', touchend);
    }

    return () => {
      if (currentRef) currentRef.removeEventListener('scroll', scroll);
      window.touchesCb = window.touchesCb || {};
      delete window.touchesCb.mailBoxScrollProgress;
      if (!isMobileApp()) {
        window.removeEventListener('touchstart', touchstart);
        window.removeEventListener('touchend', touchend);
      }
    };
  }, [outerRef]);

  return setOuterRef;
};
