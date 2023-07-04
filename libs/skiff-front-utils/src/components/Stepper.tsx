import { motion } from 'framer-motion';
import { Typography, TypographySize, TypographyWeight } from '@skiff-org/skiff-ui';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
export interface DescriptionItem {
  bold: string;
  text: string;
}

const CarouselItem = motion(Typography);

const Circle = styled.li<{ selected: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${(props) => (props.selected ? 'var(--text-primary)' : 'var(--text-disabled)')};
`;

const CircleList = styled.ul`
  margin: 0;
  padding: 0;
  display: flex;
  gap: 10px;
  justify-content: center;
  list-style: none;
`;

const CarouselItemContainer = styled(motion.div)`
  display: flex;
`;

const CarouselContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
  overflow: hidden;
`;
interface CarouselProps {
  descriptionList: DescriptionItem[];
}

const useElementWidth = (elementRef: React.MutableRefObject<HTMLElement> | React.MutableRefObject<null>) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (elementRef.current) {
      setWidth(elementRef.current.scrollWidth);
    }
  }, [elementRef]);

  return width;
};

export const Stepper = ({ descriptionList }: CarouselProps) => {
  const [currentLocation, setCurrentLocation] = useState(0);

  const carouselContainerRef = useRef(null);
  const width = useElementWidth(carouselContainerRef) / descriptionList.length;
  const currentView = -width * currentLocation; // current displayed width of the list element.
  const circles = useMemo(
    () =>
      descriptionList.map((_, index) => (
        <Circle key={index} onClick={() => setCurrentLocation(index)} selected={index === currentLocation} />
      )),
    [currentLocation, descriptionList]
  );
  const swipeLeft = () => currentLocation !== descriptionList.length - 1 && setCurrentLocation((prev) => prev + 1); // don't allow swiping left when at the end of the list.
  const swipeRight = () => currentLocation !== 0 && setCurrentLocation((prev) => prev - 1); // don't allow swiping right at the start of the list.
  const SWIPE_DISTANCE = width * 0.4;
  const SWIPE_VELOCITY_FACTOR = 0.2;
  return (
    <CarouselContainer>
      <motion.div>
        <CarouselItemContainer
          animate={{ x: currentView }}
          drag='x'
          dragConstraints={{
            right: currentView,
            left: currentView
          }}
          dragElastic={0.5}
          onDragEnd={(_, info) => {
            if (info.offset.x + SWIPE_VELOCITY_FACTOR * info.velocity.x < -SWIPE_DISTANCE) {
              swipeLeft();
            } else if (info.offset.x + SWIPE_VELOCITY_FACTOR * info.velocity.x > SWIPE_DISTANCE) {
              swipeRight();
            }
          }}
          ref={carouselContainerRef}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        >
          {descriptionList.map((descriptionItem, index) => (
            <CarouselItem
              color='disabled'
              key={index}
              minWidth='100%'
              size={TypographySize.H2}
              weight={TypographyWeight.BOLD}
              wrap
            >
              <Typography minWidth='100%' size={TypographySize.H2} weight={TypographyWeight.BOLD} wrap>
                {descriptionItem.bold}
              </Typography>
              {descriptionItem.text}
            </CarouselItem>
          ))}
        </CarouselItemContainer>
      </motion.div>
      <CircleList>{circles}</CircleList>
    </CarouselContainer>
  );
};
