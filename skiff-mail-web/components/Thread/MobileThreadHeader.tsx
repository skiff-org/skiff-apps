import {
  FilledVariant,
  Icon,
  IconButton,
  Size,
  Typography,
  TypographySize,
  TypographyWeight
} from '@skiff-org/skiff-ui';
import { useEffect, useState } from 'react';
import { isAndroid } from 'react-device-detect';
import { isMobileApp } from 'skiff-front-utils';
import styled from 'styled-components';

import { NO_SUBJECT_TEXT } from '../../constants/mailbox.constants';
import { useThreadActions } from '../../hooks/useThreadActions';
import { THREAD_HEADER_BACKGROUND_ID, THREAD_HEADER_CONTAINER_ID, THREAD_HEADER_ID } from '../mailbox/consts';

const BackButtonTitleContainer = styled.div<{ hasUserLabels?: boolean }>`
  display: flex;
  .icon-button {
    padding: 0;
  }
`;

const HeaderButtonsGroup = styled.div`
  display: flex;
  justify-content: space-between;
`;

const NavButtons = styled.div`
  display: flex;
  align-items: center;
`;

const HeaderButtonContainer = styled.div`
  margin-bottom: 4px;
  padding-top: constant(safe-area-inset-top); /* IOS < 11.2*/
  padding-top: env(safe-area-inset-top); /* IOS > = 11.2*/
  ${isMobileApp() && isAndroid && `padding-top:${window.statusBarHeight + 'px'};`}
`;

const TextContainer = styled.div`
  margin-left: 16px;
`;

// px of when the animation will be completed (from top)
const SCROLL_ANIMATION_MAX_HEIGHT = 70;
const calcScrollAnimatedOffset = (scrollTop, min, max) => {
  if (scrollTop < 0) {
    return min;
  }
  if (scrollTop > SCROLL_ANIMATION_MAX_HEIGHT) {
    // In case scroll is above the threshold return max
    return max;
  }
  const scrollProgress = scrollTop * (100 / SCROLL_ANIMATION_MAX_HEIGHT);
  const propCalcOffsetByProgress = scrollProgress / (100 / (min - max));
  return min - propCalcOffsetByProgress;
};

const mailThreadOffset = 42;

/**
 * Contains the backwards and more options button as well
 * as the title of the thread on mobile devices
 * returns a different component depending on whether the thread has labels
 */
export default function MobileThreadHeader({
  onClose,
  hasUserLabels,
  text,
  threadBodyRef,
  prevThreadID,
  nextThreadID
}: MobileThreadHeaderTitleProps) {
  const { setActiveThreadID } = useThreadActions();
  const [titleWrap, setTitleWrap] = useState<boolean>(true);

  // Add listener on thread body scroll event for update header height, font-size and more
  useEffect(() => {
    const currentRef = threadBodyRef!.current;
    let headerRef: HTMLElement | null = null;
    let backRef: HTMLElement | null = null;
    let headerContainerRef: HTMLElement | null = null;
    const updateBodyScrollOffset = (e) => {
      const bodyScrollOffset = e.target!.scrollTop;
      headerRef = headerRef || document.getElementById(THREAD_HEADER_ID);
      backRef = backRef || document.getElementById(THREAD_HEADER_CONTAINER_ID);
      headerContainerRef = headerContainerRef || document.getElementById(THREAD_HEADER_BACKGROUND_ID);
      if (headerRef && backRef && headerContainerRef) {
        setTitleWrap(bodyScrollOffset <= 20);
        const heightChange = calcScrollAnimatedOffset(bodyScrollOffset, 0, mailThreadOffset);
        headerRef.style.whiteSpace = bodyScrollOffset > 10 ? 'nowrap' : headerRef?.style.whiteSpace;
        backRef.style.transform = `translateY(${1 * heightChange}px)`;
        headerContainerRef.style.marginBottom = `${-1 * heightChange}px`;
        headerContainerRef.style.transform = `translateY(${-1 * heightChange}px)`;
        headerRef.style.transform = `scale(${calcScrollAnimatedOffset(bodyScrollOffset, 1, 0.85)}) translateY(${
          -1 * heightChange
        }px)`;
      }
    };
    if (currentRef) {
      currentRef.addEventListener('scroll', updateBodyScrollOffset, true);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', updateBodyScrollOffset, true);
      }
    };
  }, []);

  return (
    <HeaderButtonContainer id={THREAD_HEADER_CONTAINER_ID}>
      <HeaderButtonsGroup>
        <BackButtonTitleContainer hasUserLabels={hasUserLabels}>
          <IconButton
            icon={Icon.Backward}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            size={Size.LARGE}
            variant={FilledVariant.UNFILLED}
          />
        </BackButtonTitleContainer>
        <NavButtons>
          <IconButton
            disabled={!prevThreadID}
            icon={Icon.ChevronUp}
            onClick={(e) => {
              e.stopPropagation();
              if (!!prevThreadID) {
                setActiveThreadID({ threadID: prevThreadID });
              }
            }}
            size={Size.LARGE}
            variant={FilledVariant.UNFILLED}
          />
          <IconButton
            disabled={!nextThreadID}
            icon={Icon.ChevronDown}
            onClick={(e) => {
              e.stopPropagation();
              if (!!nextThreadID) {
                setActiveThreadID({ threadID: nextThreadID });
              }
            }}
            size={Size.LARGE}
            variant={FilledVariant.UNFILLED}
          />
        </NavButtons>
      </HeaderButtonsGroup>
      <TextContainer>
        <Typography
          mono
          uppercase
          id={THREAD_HEADER_ID}
          maxWidth='calc(100vw - 116px)'
          size={TypographySize.H3}
          weight={TypographyWeight.MEDIUM}
          wrap={titleWrap}
        >
          {text?.trim() || NO_SUBJECT_TEXT}
        </Typography>
      </TextContainer>
    </HeaderButtonContainer>
  );
}
interface MobileThreadHeaderTitleProps {
  onClose: () => void;
  hasUserLabels?: boolean;
  text: string | null | undefined;
  threadBodyRef?: React.RefObject<HTMLDivElement>;
  // previous threadID
  prevThreadID?: string;
  // next threadID
  nextThreadID?: string;
}
