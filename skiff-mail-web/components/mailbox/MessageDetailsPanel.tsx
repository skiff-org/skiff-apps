import useMediaQuery from '@mui/material/useMediaQuery';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useSwipeBack } from 'skiff-front-utils';
import styled, { css } from 'styled-components';

import { COMPACT_MAILBOX_BREAKPOINT } from '../../constants/mailbox.constants';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import useLocalSetting, { ThreadDisplayFormat } from '../../hooks/useLocalSetting';
import { useThreadActions } from '../../hooks/useThreadActions';

import {
  BOTTOM_NAVIGATION_CONTAINER,
  MAIL_LIST_CONTAINER_ID,
  PINCH_TO_ZOOM_CONTAINER,
  PINCH_TO_ZOOM_CONTENT,
  THREAD_CONTAINER_ID
} from './consts';

const SwipeZone = styled.div`
  height: 100%;
  width: 20px;
  position: absolute;
`;

const MessageDetailsPanelContainer = styled(motion.div)<{ animation?: boolean; radius?: boolean }>`
  position: relative;
  align-self: flex-end;
  height: 100%;
  box-sizing: border-box;

  display: flex;
  flex-direction: column;
  overflow: hidden;

  // Hide scrollbar
  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;

  ${isMobile
    ? css`
        left: 0;
        position: absolute;
        width: 100vw;
        margin: 0;
        right: 16px;
        display: flex;
        background: var(--bg-l1-solid);
        border-radius: 0;
        box-shadow: none;
        border: none;
        max-height: unset;
        transform: translateX(100vw);
        z-index: 2;
      `
    : ''}
  ${({ radius }) => (radius ? 'border-radius: 16px 16px 0px 0px;' : '')}
  ${(props) => (!!props.animation && isMobile ? 'transform: translateX(calc(100vw * var(--mailswipep, 0)));' : '')}
`;

type MessageDetailsPanelProps = {
  children: React.ReactNode;
  open: boolean;
};

const getBottomNavigationContainer = () => document.getElementById(BOTTOM_NAVIGATION_CONTAINER);

const MobileMessageDetailsPanelContainer: React.FC<{ children: React.ReactNode }> = (props: {
  children: React.ReactNode;
}) => {
  const { children } = props;
  const { setActiveThreadID } = useThreadActions();
  const [animation, setAnimation] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setAnimation(true);
    });
  }, []);

  const { changeProgress } = useSwipeBack(
    THREAD_CONTAINER_ID,
    MAIL_LIST_CONTAINER_ID,
    () => {
      setActiveThreadID(undefined);

      // Reset the bottom toolbar for multi-select
      const bottomNavigationContainer = getBottomNavigationContainer();
      if (bottomNavigationContainer) bottomNavigationContainer.style.transform = '';
    },
    [PINCH_TO_ZOOM_CONTAINER, PINCH_TO_ZOOM_CONTENT], // Avoid shaking issue when sometimes touch events comes from inside the iframe (pinch to zoom)
    (progress, transition) => {
      const bottomNavigationContainer = getBottomNavigationContainer();
      if (!bottomNavigationContainer) {
        return false;
      }
      if (transition) {
        bottomNavigationContainer.style.transition = `transform ${transition} ease-in-out`;
      }
      bottomNavigationContainer.style.transform = `translateX(calc(100vw * ${progress}))`;
      return false;
    }
  );

  useEffect(() => {
    // Important for making the initial animation
    // TODO: move all of these to framer-motion
    changeProgress(`0`, `0.2s`);
  }, []);

  const { composeOpen } = useAppSelector((state) => state.modal);
  return (
    <MessageDetailsPanelContainer animation={animation} id={THREAD_CONTAINER_ID} radius={!!composeOpen}>
      {/* Invisible div that make it easy swipe back to inbox from the left edge */}
      <SwipeZone />
      {children}
    </MessageDetailsPanelContainer>
  );
};

const MessageDetailsPanel: React.FC<MessageDetailsPanelProps> = (props: MessageDetailsPanelProps) => {
  const { children, open } = props;
  const [threadFormat] = useLocalSetting('threadFormat');
  const isCompact = useMediaQuery(`(max-width:${COMPACT_MAILBOX_BREAKPOINT}px)`, { noSsr: true });

  if (!open) return null;

  if (isMobile) {
    return <MobileMessageDetailsPanelContainer>{children}</MobileMessageDetailsPanelContainer>;
  }

  return (
    <MessageDetailsPanelContainer
      animate={{ width: isCompact || threadFormat === ThreadDisplayFormat.Full ? '100%' : '46vw' }}
      initial={false}
      transition={{ duration: 0.2, ease: [0.04, 0.62, 0.23, 0.98] }}
    >
      {children}
    </MessageDetailsPanelContainer>
  );
};

export default MessageDetailsPanel;
