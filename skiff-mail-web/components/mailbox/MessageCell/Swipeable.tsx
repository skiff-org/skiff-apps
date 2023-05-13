import React, { useCallback, useEffect, useRef } from 'react';
import { isSwipeHorizontal } from 'skiff-front-utils';
import styled from 'styled-components';

import { SWIPE_TRANSITION_DURATION } from './constants';
import { waitFor } from './utils';

const LeftSide = styled.div`
  display: inline-block;
  position: relative;
  width: 33.3%;
`;

const RightSide = styled.div`
  display: inline-block;
  position: relative;
  width: 33.3%;
`;
const Body = styled.div`
  width: 33.5%;
`;
const SwipeableContainer = styled.div`
  width: 300%;
  display: flex;
  transform: translateX(-33.3%);
  height: 100%;
`;
const SwipeableWrapper = styled.div``;

let lastX, lastY, dis, swipeActive, complete;

type Props = {
  children: React.ReactNode; // Swipeable main contant
  rightComponent?: React.ReactNode; // ReactNode to be render as the right side of the SwipeableCard
  leftComponent?: React.ReactNode; // ReactNode to be render as the left side of the SwipeableCard
  completeThreshold: number; // The PX the user should swipe for complete the action
  disableSwipe?: boolean; // When false the swipe will be disable
  onSwipe?: (progress: number) => void; // CB that call on every swipe change - Performance must be considered when use
  onSwipePassThreshold?: (progress: number) => void; // CB when the user pass the completeThreshold
  onSwipeComplete: (progress: number) => void; // CB when the user pass the completeThreshold & thouch end, progress will be nagative when swipe to the right
  [x: string]: any; // Any other prop will be pass to the main container
  leftSwipeIsArchiveOrTrash: boolean;
  rightSwipeIsArchiveOrTrash: boolean;
};

export const Swipeable = ({
  children,
  rightComponent,
  leftComponent,
  onSwipe,
  disableSwipe,
  completeThreshold,
  onSwipePassThreshold,
  onSwipeComplete,
  leftSwipeIsArchiveOrTrash,
  rightSwipeIsArchiveOrTrash,
  ...rest
}: Props) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const swipe = (progress: string, animate?: boolean) => {
    if (containerRef.current) {
      containerRef.current.style.transition = `transform ${animate ? '0.25s  cubic-bezier(0.3, 0, 0.5, 1)' : '0s'}`;
      containerRef.current.style.transform = `translateX(${progress})`;
    }
  };

  const resetSwipe = (animate?: boolean) => {
    swipe('-33.33%', animate);
    dis = 0;
    complete = false;
  };

  useEffect(() => {
    if (disableSwipe) {
      resetSwipe(true);
    }
  }, [disableSwipe]);

  const handleTouchStart = (e) => {
    const { clientX, clientY } = e.touches[0];
    lastX = clientX;
    lastY = clientY;
    resetSwipe();
    swipeActive = true;
  };
  const handleTouchEnd = async () => {
    if (Math.abs(dis) > completeThreshold) {
      onSwipeComplete(dis);
      if (dis < 0 && leftSwipeIsArchiveOrTrash) {
        // In case of swipe to the left (Archive) complete the swipe -66.66% and wait for the animation
        swipe('-66.66%', true);
        await waitFor(SWIPE_TRANSITION_DURATION);
        return;
      } else if (dis > 0 && rightSwipeIsArchiveOrTrash) {
        // In case of right to the left (Archive) complete the swipe 33.33% and wait for the animation
        swipe('33.33%', true);
        await waitFor(SWIPE_TRANSITION_DURATION);
        return;
      }
    }
    resetSwipe(true);
  };

  const handleTouchMove = useCallback(
    (e) => {
      if (!swipeActive || disableSwipe) {
        return;
      }

      const { clientX, clientY } = e.touches[0];
      const horizontalAngleWithFirstTouch = isSwipeHorizontal(lastX, lastY, clientX, clientY);
      if (!horizontalAngleWithFirstTouch && !dis) {
        // Avoid swipe horizontal when swipe for scrolling list (vertical)
        swipeActive = false;
        return;
      }

      // Calc distance from the first touch
      dis = clientX - lastX;

      if (containerRef.current) {
        swipe(`calc(-33.3% + ${dis}px)`);
        if (onSwipe) {
          onSwipe(dis);
        }
        if (completeThreshold < Math.abs(dis) && !complete) {
          // When the user pass the complete thrshold for the first time
          if (onSwipePassThreshold) {
            onSwipePassThreshold(dis);
          }
          complete = true;
        }
        if (completeThreshold > Math.abs(dis) && complete) {
          // When the user pass the complete thrshold in the way back
          complete = false;
          if (onSwipePassThreshold) {
            onSwipePassThreshold(dis);
          }
        }
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [disableSwipe]
  );

  useEffect(() => {
    if (wrapperRef.current) {
      // passive: false to be able cancel scroll event in case of swipe
      wrapperRef.current.addEventListener('touchmove', handleTouchMove, { passive: false });
      return () => {
        wrapperRef.current?.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [handleTouchMove]);

  return (
    <SwipeableWrapper onTouchEnd={handleTouchEnd} onTouchStart={handleTouchStart} ref={wrapperRef} {...rest}>
      <SwipeableContainer ref={containerRef}>
        <LeftSide>{leftComponent}</LeftSide>
        <Body>{children}</Body>
        <RightSide>{rightComponent}</RightSide>
      </SwipeableContainer>
    </SwipeableWrapper>
  );
};
