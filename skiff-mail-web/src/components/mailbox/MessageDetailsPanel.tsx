import { NumberSize, Resizable } from 're-resizable';
import React, { useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useMediaQuery, useSwipeBack, useUserPreference } from 'skiff-front-utils';
import { ThreadDisplayFormat } from 'skiff-graphql';
import { StorageTypes, getStorageKey } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { FULL_VIEW_BREAKPOINT } from '../../constants/mailbox.constants';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useThreadActions } from '../../hooks/useThreadActions';

import {
  BOTTOM_NAVIGATION_CONTAINER,
  MAIL_LIST_CONTAINER_ID,
  PINCH_TO_ZOOM_CONTAINER,
  PINCH_TO_ZOOM_CONTENT,
  THREAD_CONTAINER_ID
} from './consts';

// Define some styles for your resizable handle.
const Handle = styled.div`
  width: 4px;
  height: 100%;
  background: transparent;
  cursor: col-resize;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 9;
  &:hover {
    background: var(--border-primary);
  }
`;

const ResizeHandle = (props) => {
  return <Handle {...props} onClick={(e) => e.stopPropagation()} />;
};

const SwipeZone = styled.div`
  height: 100%;
  width: 20px;
  position: absolute;
`;

const MessageDetailsPanelContainer = styled.div<{ animation?: boolean; radius?: boolean }>`
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
        left: 0px;
        top: 0px;
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

const VIEW_WIDTH_PERCENTAGE = 42;
const COMPACT_PANEL_MIN_WIDTH = 520;
const WINDOW_OFFSET = 660;

type MessageDetailsPanelProps = {
  children: React.ReactNode;
  open: boolean;
  // used in contexts when the Mailbox shows the ActivationPane
  setActivationPaneOffsetWidth?: (offset: React.SetStateAction<number>) => void;
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

  const swipeHook = useSwipeBack(
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
    if (swipeHook) {
      swipeHook.changeProgress(`0`, `0.2s`);
    }
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

const MessageDetailsPanel: React.FC<MessageDetailsPanelProps> = ({ children, open, setActivationPaneOffsetWidth }) => {
  const [threadFormat] = useUserPreference(StorageTypes.THREAD_FORMAT);
  const isCompact = useMediaQuery(`(max-width:${FULL_VIEW_BREAKPOINT}px)`, { noSsr: true });

  const [defaultWidth, setDefaultWidth] = useState(getPanelWidth(VIEW_WIDTH_PERCENTAGE));
  const [maxWidth, setMaxWidth] = useState(getAvailableWindowWidth());
  const initialWidth = getInitialWidth(defaultWidth);

  const [panelWidth, setPanelWidth] = useState(initialWidth);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setMaxWidth(getAvailableWindowWidth());
      setDefaultWidth(getPanelWidth(VIEW_WIDTH_PERCENTAGE));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // position the ActivationPane in relation to MessageDetailsPanel
  // and zero out the offset on dismount;
  // uses ResizeObserver as opposed to an event listener to ensure
  // correct repositioning when toggling from full to split layouts
  useEffect(() => {
    if (!setActivationPaneOffsetWidth) return;
    let observer: null | ResizeObserver = null;
    const panel = panelRef.current;
    if (panel) {
      observer = new ResizeObserver((entries) => {
        const { width } = entries[0]?.contentRect ?? { width: 0 };
        setActivationPaneOffsetWidth(width);
      });
      observer.observe(panel);
    }
    return () => {
      if (observer && panel) {
        observer.unobserve(panel);
      }
      setActivationPaneOffsetWidth(0);
    };
  }, [panelRef, setActivationPaneOffsetWidth]);

  if (!open) return null;

  if (isMobile) return <MobileMessageDetailsPanelContainer>{children}</MobileMessageDetailsPanelContainer>;

  if (isCompact || threadFormat === ThreadDisplayFormat.Full) {
    return (
      <MessageDetailsPanelContainer ref={panelRef} style={{ width: '100%' }}>
        {children}
      </MessageDetailsPanelContainer>
    );
  }

  return renderResizablePanel(panelWidth, maxWidth, setPanelWidth, panelRef, children);
};

const getPanelWidth = (percentage) => {
  return (percentage / 100) * window.innerWidth;
};

const getAvailableWindowWidth = () => {
  return window.innerWidth - WINDOW_OFFSET;
};

const getInitialWidth = (defaultWidth: number) => {
  return parseFloat(localStorage.getItem(getStorageKey(StorageTypes.RESIZE_WIDTH)) || `${defaultWidth}`);
};

const renderResizablePanel = (
  panelWidth: number,
  maxWidth: number,
  setPanelWidth: (newWidth: number) => void,
  panelRef: React.RefObject<HTMLDivElement>,
  children
) => {
  return (
    <Resizable
      defaultSize={{
        width: panelWidth,
        height: '100%'
      }}
      enable={{ top: false, right: false, bottom: false, left: true }}
      handleComponent={{ left: <ResizeHandle /> }}
      maxWidth={maxWidth}
      minWidth={COMPACT_PANEL_MIN_WIDTH}
      onResizeStop={(_e, _direction, _ref, d) => handleResizeStop(panelWidth, d, setPanelWidth)}
    >
      <MessageDetailsPanelContainer ref={panelRef}>{children}</MessageDetailsPanelContainer>
    </Resizable>
  );
};

const handleResizeStop = (panelWidth: number, d: NumberSize, setPanelWidth: (newWidth: number) => void) => {
  const newWidth = panelWidth + d.width;
  setPanelWidth(newWidth);
  localStorage.setItem(getStorageKey(StorageTypes.RESIZE_WIDTH), `${newWidth}`);
};

export default MessageDetailsPanel;
