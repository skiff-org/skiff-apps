import { useEffect, useRef, useState } from 'react';
import { isIOS } from 'react-device-detect';
import { isSwipeHorizontal } from 'skiff-front-utils';
import styled from 'styled-components';

import { useAppSelector } from '../../../utils';

// Scrollview of the calendar
const Container = styled.div`
  height: 100%;
  position: relative;
  overflow: visible;
`;

const Slide = styled.div<{ $itemWidth: number; $slideIndex: number }>`
  position: absolute;
  top: 0;
  left: 0;
  min-width: ${(props) => props.$itemWidth}px;
  height: 100%;
  transform: ${(props) => `translateX(${props.$slideIndex * props.$itemWidth}px)`};
`;

const CAROUSEL_TRANSITION = `transform 300ms`;

interface ChronometricVirtualizedDisplayProps {
  disableTransition?: boolean;
  index: number;
  onIndexChange: (index: number) => void;
  slideRenderer: (index: number, disableRender: boolean) => React.ReactNode;
  itemWidth: number;
  onSwipeStart?: () => void;
}

enum RenderHiddenDays {
  NoRender,
  Tomorrow,
  Yesterday
}

export default function ChronometricVirtualizedDisplay({
  disableTransition = false,
  index,
  onIndexChange,
  itemWidth,
  slideRenderer,
  onSwipeStart
}: ChronometricVirtualizedDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const draggedEventID = useAppSelector((state) => state.eventDragging.draggedEventData.draggedEventID);

  const [shouldRenderHiddenDays, setShouldRenderHiddenDays] = useState<RenderHiddenDays>(RenderHiddenDays.NoRender);

  useEffect(() => {
    const offset = -itemWidth * index;
    const container = containerRef.current;
    if (!container) return;
    container.style.transform = `translateX(${offset}px)`;
    if (disableTransition) {
      container.style.transition = 'none';
    }
  }, [index, itemWidth, containerRef, disableTransition]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setShouldRenderHiddenDays(RenderHiddenDays.NoRender);
    let isSwiping = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let distance = 0;

    const offset = -itemWidth * index; // Offset is the index * the width of an item

    const handleTouchStart = (event: TouchEvent) => {
      container.style.transition = 'none'; // Disable transition
      isSwiping = true;
      startX = currentX = event.touches[0].pageX;
      startY = event.touches[0].pageY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isSwiping) return;
      const { pageX, pageY } = event.touches[0];
      // If the swipe is vertical or an event is being dragged, disable swipe
      if ((!isSwipeHorizontal(startX, startY, pageX, pageY) && !distance) || draggedEventID) {
        setShouldRenderHiddenDays(RenderHiddenDays.NoRender);
        isSwiping = false;
        // Snap back
        container.style.transition = CAROUSEL_TRANSITION;
        container.style.transform = `translateX(${offset}px)`;
        return;
      }

      // Call on swipe start
      if (onSwipeStart) onSwipeStart();

      if (isIOS) {
        // don't allow scroll when swiping IOS Safari Only
        event.preventDefault();
      }

      distance = pageX - startX; // Calc distance from the first touch

      currentX = pageX;
      const translateX = offset + currentX - startX;
      container.style.transform = `translateX(${translateX}px)`;
      if (currentX > startX) {
        setShouldRenderHiddenDays(RenderHiddenDays.Yesterday);
      } else if (currentX < startX) {
        setShouldRenderHiddenDays(RenderHiddenDays.Tomorrow);
      }
    };

    const handleTouchEnd = () => {
      isSwiping = false;
      container.style.transition = CAROUSEL_TRANSITION;
      const translateX = currentX - startX;
      const threshold = itemWidth / 3;
      if (Math.abs(translateX) > threshold) {
        if (translateX > 0) {
          container.style.transform = `translateX(-${(index - 1) * itemWidth}px)`;
          // To avoid flickering if no transition
          if (disableTransition) {
            onIndexChange(index - 1);
          } else {
            setTimeout(() => onIndexChange(index - 1), 50); // Changing the index causes animation to slow down on android, so we give it some time
          }
        } else {
          container.style.transform = `translateX(-${(index + 1) * itemWidth}px)`;
          if (disableTransition) {
            onIndexChange(index + 1);
          } else {
            setTimeout(() => onIndexChange(index + 1), 50);
          }
        }
        setTimeout(() => {
          setShouldRenderHiddenDays(RenderHiddenDays.NoRender); // To prevent having a white screen during the animation of moving to another screen
        }, 50);
      } else {
        container.style.transform = `translateX(${offset}px)`;
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, index, itemWidth, onIndexChange, draggedEventID]);

  function renderSlide(slideIndex: number, disableRender = false) {
    return (
      <Slide $itemWidth={itemWidth} $slideIndex={slideIndex} key={slideIndex} ref={slideRef}>
        {slideRenderer(slideIndex, disableRender)}
      </Slide>
    );
  }

  return (
    <Container ref={containerRef}>
      {renderSlide(index - 1, shouldRenderHiddenDays !== RenderHiddenDays.Yesterday)}
      {renderSlide(index)}
      {renderSlide(index + 1, shouldRenderHiddenDays !== RenderHiddenDays.Tomorrow)}
    </Container>
  );
}
