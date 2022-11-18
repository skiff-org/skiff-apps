import { BottomNavigation } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { MailboxThreadInfo } from '../../../models/thread';
import { BOTTOM_NAVIGATION_CONTAINER, BOTTOM_NAVIGATION_HEIGHT } from '../../mailbox/consts';
import ProgressBar from '../ProgressBar';

import { MultipleItemSelectToolbar } from './MultipleItemSelectToolbar';
import { ThreadToolbar } from './ThreadToolbar';

const BottomNavigationContainer = styled.div`
  width: 100%;
  bottom: 0px;
  position: absolute;
  z-index: 13;
  transition: transform 0.2s;
`;

const StyledBottomNavigation = styled(BottomNavigation)<{ sendingProgress: number | undefined }>`
  display: flex;
  border-top: 1px solid var(--border-secondary);
  background: var(--bg-l3-solid) !important;
  padding-bottom: constant(safe-area-inset-bottom); /* compatible with IOS < 11.2*/
  padding-bottom: env(safe-area-inset-bottom); /* compatible with IOS > = 11.2*/
  height: ${BOTTOM_NAVIGATION_HEIGHT}px;
`;

interface MobileBottomNavigationProps {
  // Threads shown in mailbox
  threads: MailboxThreadInfo[];
}
export default function MobileBottomNavigation({ threads }: MobileBottomNavigationProps) {
  const [sendingProgress, setSendingProgress] = useState<number | undefined>(undefined);
  const { isSending: isEmailSending } = useAppSelector((state) => state.modal);
  const { multSelectActive, activeThreadID } = useAppSelector((state) => {
    return {
      multSelectActive: state.mobileDrawer.multipleItemSelector,
      activeThreadID: state.mailbox.activeThread.activeThreadID
    };
  });

  // Send progress logic
  const interval = useRef<NodeJS.Timeout>();
  const clearTimer = () => {
    if (interval.current) {
      clearInterval(interval.current);
    }
  };

  useEffect(() => {
    if (isEmailSending && sendingProgress === undefined) {
      // linearly increment progress while message is sending
      interval.current = setInterval(() => {
        setSendingProgress((prev) => {
          // start progress bar
          if (prev === undefined) return 0;
          // increment progress
          if (prev < 95) return prev + 1;
          // hang at 95 until message is sent
          return prev;
        });
      });
    } else if (!isEmailSending && sendingProgress !== undefined) {
      clearTimer();
      // maximize progress bar
      setSendingProgress(100);
      // remove progress bar after timeout
      setTimeout(() => {
        setSendingProgress(undefined);
      }, 2000);
    }
  }, [isEmailSending, setSendingProgress, sendingProgress]);

  // Toolbar logic
  const activeThread = activeThreadID && threads.find((t) => t.threadID === activeThreadID);
  // Return correct toolbar component based on toolbar type
  const renderToolbar = () => {
    if (activeThread) {
      return <ThreadToolbar thread={activeThread} />;
    } else if (multSelectActive) {
      return <MultipleItemSelectToolbar threads={threads} />;
    } else {
      return undefined;
    }
  };
  const toolbar = renderToolbar();

  return (
    <>
      <BottomNavigationContainer id={BOTTOM_NAVIGATION_CONTAINER}>
        <ProgressBar completed={sendingProgress} />
        {toolbar && <StyledBottomNavigation sendingProgress={sendingProgress}>{toolbar}</StyledBottomNavigation>}
      </BottomNavigationContainer>
      <ProgressBar completed={sendingProgress} />
    </>
  );
}
