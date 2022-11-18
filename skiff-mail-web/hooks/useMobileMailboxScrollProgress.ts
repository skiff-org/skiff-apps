import { useEffect, useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { isMobileApp } from 'skiff-front-utils';

import { animateMailListHeader, MOBILE_HEADER_HEIGHT } from '../components/mailbox/MailboxHeader';

const DISTANCE_THRESHOLD = 3;

enum HeaderStatus {
  Hidden,
  Show
}

export const useMobileMailboxScrollProgress = () => {
  // We store the last scroll pos for calc the progress
  const lastScrollPos = useRef<number>(0);
  // Status of header (Show/hidden)
  const headerVisibility = useRef<HeaderStatus>(HeaderStatus.Show);
  // Needed for knowing when the virualized list is ready and the scrollArea ref is not null
  const [outerRef, setOuterRef] = useState<HTMLDivElement | null>(null);

  const INSET_TOP = useMemo(() => {
    const prop = getComputedStyle(document.documentElement).getPropertyValue('--sat');
    return prop ? Number(prop.replace('px', '')) : 0;
  }, []);

  useEffect(() => {
    const currentRef = outerRef;
    if (!currentRef || !isMobile) {
      return;
    }

    let touchLeadsToScroll = false;
    const touchstart = () => {
      touchLeadsToScroll = false;
      lastScrollPos.current = lastScrollPos.current;
    };

    const touchend = () => {
      if (!touchLeadsToScroll || !currentRef) {
        // We are using the touchstart from the RN side (becouse of an issue with ios detaild below) we want to verify touch trigger scroll change on mail list
        return;
      }
      // On touchend round the progress and by that close/open the header/bottomNav
      const currentScrollTop = currentRef.scrollTop;
      if (
        currentScrollTop < MOBILE_HEADER_HEIGHT + INSET_TOP &&
        currentScrollTop > 0 &&
        headerVisibility.current === HeaderStatus.Hidden
      ) {
        // In case of close on touchend scroll the mail list
        currentRef.scrollTo({
          top: MOBILE_HEADER_HEIGHT,
          behavior: 'smooth'
        });
      }
    };

    const scroll = (e) => {
      if (!currentRef) {
        return;
      }
      touchLeadsToScroll = true;
      const scrollTop = e.target!.scrollTop;
      const distance = lastScrollPos.current - scrollTop;
      lastScrollPos.current = scrollTop;

      // Ignore if distance does not pass threshold or at top
      if (Math.abs(distance) < DISTANCE_THRESHOLD || scrollTop <= 0) return;
      if (distance > 0 && headerVisibility.current === HeaderStatus.Hidden) {
        animateMailListHeader('1', '0.2s');
        headerVisibility.current = HeaderStatus.Show;
      } else if (distance < 0 && headerVisibility.current === HeaderStatus.Show) {
        animateMailListHeader('0', '0.2s');
        headerVisibility.current = HeaderStatus.Hidden;
      }
    };

    currentRef.addEventListener('scroll', scroll);

    window.touchesCb = window.touchesCb || {};
    window.touchesCb.mailBoxScrollProgress = (event) => {
      // We are using the "native" onTouchStart/end beacouse on iOS when user start touch while scroll those event not called
      if (event === 'start') {
        touchstart();
      } else if (event === 'end') {
        touchend();
      }
    };

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
