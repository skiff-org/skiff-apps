import first from 'lodash/first';
import { MutableRefObject, RefObject, useCallback, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { FixedSizeList, VariableSizeList } from 'react-window';
import { usePrevious } from 'skiff-front-utils';

import { useRouterLabelContext } from '../context/RouterLabelContext';
import { MailboxThreadInfo } from '../models/thread';
import { skemailWindowReducer } from '../redux/reducers/windowReducer';
import { getItemHeight } from '../utils/mailboxUtils';

import { COMPACT_MAILBOX_BREAKPOINT } from './../constants/mailbox.constants';
import { useAppSelector } from './redux/useAppSelector';
import { useThreadActions } from './useThreadActions';

function easeInOutQuint(t: number) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
}

const SCROLL_DURATION_MS = 2000;

export const useRestoreScroll = (
  listRef: RefObject<VariableSizeList | FixedSizeList>,
  scrollOffset: MutableRefObject<number>,
  threads: MailboxThreadInfo[],
  displayMobileSearchResults: boolean,
  listWidth: number
) => {
  const { value: label } = useRouterLabelContext();
  const lastKnownScrollOffset = useAppSelector((state) => state.window.scrollOffset)[label] ?? 0;
  const { activeThreadID } = useThreadActions();
  const itemSize = listWidth === 0 ? undefined : getItemHeight(isMobile, listWidth < COMPACT_MAILBOX_BREAKPOINT);
  const currentEmailIndex = threads.findIndex((thread) => thread.threadID === activeThreadID);
  const isCompact = listWidth < COMPACT_MAILBOX_BREAKPOINT;

  const prevItemSize = usePrevious(itemSize);
  const dispatch = useDispatch();

  const [lastActiveThreadID, setLastActiveThreadID] = useState<string | undefined>(undefined);
  const lastEmailIndex = threads.findIndex((thread) => thread.threadID === lastActiveThreadID);

  useEffect(() => {
    // maintain last known active thread id, for maintaining scroll after close
    if (activeThreadID !== undefined) {
      setLastActiveThreadID(activeThreadID);
    }
  }, [activeThreadID]);

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

  // Use currentEmailIndex in maintainScrollPosition
  const maintainScrollPosition = useCallback(
    (newIncoming: number, isModeChange = false) => {
      const currentScrollPos = scrollOffset.current;
      if (currentScrollPos === 0 && !isModeChange) {
        return;
      }

      let newScrollOffset: number;

      if (isModeChange) {
        // maintain scroll position to show current email even if switching
        // from compact to non-compact.
        const offsetPerItem = (itemSize || 0) - (prevItemSize || itemSize || 0);
        if (activeThreadID !== undefined && currentEmailIndex !== -1) {
          newScrollOffset = currentScrollPos + offsetPerItem * currentEmailIndex;
        } else {
          // when closing the pane, make sure to show previously open email in view
          newScrollOffset = currentScrollPos + offsetPerItem * lastEmailIndex ?? 0;
        }
      } else {
        newScrollOffset = currentScrollPos + newIncoming * (itemSize || 0);
      }

      scrollTo(newScrollOffset, false); // Disable animation
    },
    [itemSize, prevItemSize, scrollOffset, scrollTo, currentEmailIndex, activeThreadID, lastEmailIndex]
  );

  const previousIsCompact = usePrevious(isCompact);

  useEffect(() => {
    if (isCompact !== previousIsCompact) {
      maintainScrollPosition(0, true);
    }
  }, [isCompact, maintainScrollPosition]);

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
