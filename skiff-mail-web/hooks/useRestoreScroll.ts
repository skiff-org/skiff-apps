import useMediaQuery from '@mui/material/useMediaQuery';
import { first } from 'lodash';
import { MutableRefObject, RefObject, useCallback, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { VariableSizeList } from 'react-window';
import { usePrevious } from 'skiff-front-utils';

import { useRouterLabelContext } from '../context/RouterLabelContext';
import { MailboxThreadInfo } from '../models/thread';
import { skemailWindowReducer } from '../redux/reducers/windowReducer';
import { getItemHeight } from '../utils/mailboxUtils';

import { COMPACT_MAILBOX_BREAKPOINT } from './../constants/mailbox.constants';
import { useAppSelector } from './redux/useAppSelector';

function easeInOutQuint(t: number) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
}

const SCROLL_DURATION_MS = 2000;

export const useRestoreScroll = (
  listRef: RefObject<VariableSizeList>,
  scrollOffset: MutableRefObject<number>,
  threads: MailboxThreadInfo[],
  displayMobileSearchResults: boolean
) => {
  const isCompact = useMediaQuery(`(max-width:${COMPACT_MAILBOX_BREAKPOINT}px)`);

  const { value: label } = useRouterLabelContext();
  const lastKnownScrollOffset = useAppSelector((state) => state.window.scrollOffset)[label] ?? 0;

  const dispatch = useDispatch();

  useEffect(() => {
    setTimeout(() => {
      if (!displayMobileSearchResults) {
        scrollOffset.current = lastKnownScrollOffset;
        listRef.current?.scrollTo(scrollOffset.current);
      }
    }, 100);

    return () => {
      dispatch(skemailWindowReducer.actions.setScrollOffset({ label, offset: scrollOffset.current }));
    };
  }, [dispatch, label, lastKnownScrollOffset, listRef, scrollOffset]);

  const animate = useCallback(
    (startTime: number, scrollInitial: number, scrollFinal: number) => {
      requestAnimationFrame(() => {
        const now = performance.now();
        const ellapsed = now - startTime;
        const scrollDelta = scrollFinal - scrollInitial;
        const easedTime = easeInOutQuint(Math.min(1, ellapsed / SCROLL_DURATION_MS));
        const newOffset = scrollInitial + scrollDelta * easedTime;
        listRef.current?.scrollTo(newOffset);

        if (ellapsed < SCROLL_DURATION_MS) {
          animate(startTime, scrollInitial, scrollFinal);
        }
      });
    },
    [listRef]
  );

  const scrollTo = useCallback(
    (offset: number, animated: boolean) => {
      if (!listRef.current) {
        return;
      }
      if (!animated) {
        listRef.current.scrollTo(offset);
      } else {
        animate(performance.now(), scrollOffset.current, offset);
      }
    },
    [animate, listRef, scrollOffset]
  );

  const itemSize = getItemHeight(isMobile);

  // To avoid layout shift, maintain the current scroll position
  // when new messages are received and added to mailbox.
  const maintainScrollPosition = useCallback(
    (newIncoming: number) => {
      const currentScrollPos = scrollOffset.current;

      // if current scroll position is 0, then keep list always scrolled to the top
      if (currentScrollPos === 0) {
        return;
      }

      const newScrollOffset = currentScrollPos + newIncoming * itemSize;
      scrollTo(newScrollOffset, false);
    },
    [isCompact, itemSize, scrollOffset, scrollTo]
  );

  const prevThreads = usePrevious(threads);

  useEffect(() => {
    if (!prevThreads || displayMobileSearchResults) {
      return;
    }
    const headThreadID = first(prevThreads)?.threadID;
    const newIncoming = threads.findIndex((thread) => thread.threadID === headThreadID);

    if (newIncoming > 0) {
      maintainScrollPosition(newIncoming);
    }
  }, [maintainScrollPosition, prevThreads, threads]);

  const isScrolled = scrollOffset.current > 0;

  return { scrollTo, isScrolled };
};
