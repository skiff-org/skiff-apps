import { useLottie } from 'lottie-react';
import React, { RefObject, useEffect, useRef, useState } from 'react';
import PullToRefresh from 'react-simple-pull-to-refresh';
import styled from 'styled-components';

import { MOBILE_HEADER_HEIGHT } from '../MailboxHeader';

import spinner from './lotties/spinner.json';
import useTouchYDistance from './useTouchYDistance';

const PULL_DOWN_THRESH = 50;
const FETCHED_ANIM_DURATION = 2000; // Amount of time to show fetched animation
const SPINNER_HEIGHT = 37.74; // This makes the spinner lottie exactly 24px
const PADDING_TOP = 4; // Amount of padding to add above loader to center it between first thread and searchbar

const PulledToRefreshWithMargin = styled(PullToRefresh)`
  .ptr__pull-down {
    top: ${MOBILE_HEADER_HEIGHT}px;
  }
  .ptr__loader path {
    stroke: var(--icon-secondary);
    transition: stroke 2s;
  }
  .ptr__pull-down--pull-more path {
    color: red;
    stroke: var(--icon-secondary);
  }
`;

const PullToRefreshContainer = styled.div`
  width: 100%;
`;

interface MobilePullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: JSX.Element;
  setLocked: (locked: boolean) => void;
}

export default function MobilePullToRefresh({ onRefresh, children, setLocked }: MobilePullToRefreshProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isFetching, setIsFetching] = useState(true);
  const pullingContent = <PullingContent touchRef={ref} />;
  const refreshingContent = <RefreshingContent isFetching={isFetching} />;

  const refresh = async () => {
    // Lock new mails (do not show new mails even if fetched)
    setLocked(true);
    await onRefresh();
    // Data is now fetched, play fetch complete animation
    setIsFetching(false);
    await new Promise((res) => setTimeout(res, FETCHED_ANIM_DURATION));
    // Animation complete, reset animations and unlock new mails (show mails after animation is complete)
    setIsFetching(true);
    setLocked(false);
  };

  // The animation does not like it when we change css of styled component (because it renders new element)
  // So we query the animation elements and change their color
  useEffect(() => {
    if (!ref.current) return;
    const stroke = isFetching ? 'var(--icon-secondary)' : 'var(--accent-primary-green,rgb(0, 160, 94))';
    const animationLayers = ref.current.querySelectorAll('.ptr__loader path');
    Array.from(animationLayers).forEach((layer) => {
      if (!(layer as HTMLElement).style) return;
      (layer as HTMLElement).style.stroke = stroke;
    });
  }, [isFetching]);

  return (
    <PullToRefreshContainer ref={ref}>
      <PulledToRefreshWithMargin
        onRefresh={refresh}
        pullDownThreshold={PULL_DOWN_THRESH}
        pullingContent={pullingContent}
        refreshingContent={refreshingContent}
      >
        {children}
      </PulledToRefreshWithMargin>
    </PullToRefreshContainer>
  );
}

const RELOAD_FRAMES = 43; // Amount of frames in reload animation (the animation when pulling)
function PullingContent({ touchRef }: { touchRef: RefObject<HTMLDivElement> }) {
  const distance = Math.min(useTouchYDistance(touchRef) / PULL_DOWN_THRESH, 1);

  const style = {
    height: SPINNER_HEIGHT,
    opacity: 1,
    paddingTop: PADDING_TOP
  };

  const pullingLottieObj = useLottie({ animationData: spinner }, style);

  useEffect(() => {
    const frameToPlay = distance * RELOAD_FRAMES;
    pullingLottieObj.goToAndStop(frameToPlay, true);
  }, [distance]);

  return pullingLottieObj.View;
}

type AnimationSegment = [number, number];
const loadingSegment: AnimationSegment = [33, 43];
const doneSegment: AnimationSegment = [43, 95];
function RefreshingContent({ isFetching }: { isFetching: boolean }) {
  const style = {
    height: SPINNER_HEIGHT,
    opacity: 1,
    paddingTop: PADDING_TOP
  };

  const segment = isFetching ? loadingSegment : doneSegment;

  const lottieObj = useLottie({ animationData: spinner, autoplay: false }, style);

  useEffect(() => {
    lottieObj.playSegments(segment, false);
  }, [isFetching]);

  return lottieObj.View;
}
