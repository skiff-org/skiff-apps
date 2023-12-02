import { AnimatePresence, motion } from 'framer-motion';
import React, { useRef } from 'react';
import styled, { css } from 'styled-components';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { ComposeExpandTypes } from '../../redux/reducers/modalReducer';

const BackgroundBlocker = styled(motion.div)`
  position: fixed;
  top: 0px;
  left: 0px;
  height: 100vh;
  width: 100vw;
  z-index: 100;
  background: var(--bg-scrim);
`;

const BOTTOM_MARGIN = 8;

const ComposePanelContainer = styled(motion.div)<{ $collapsedState: ComposeExpandTypes }>`
  position: absolute;
  transform-origin: bottom right;
  padding: 0px;
  ${(props) =>
    props.$collapsedState === ComposeExpandTypes.Collapsed &&
    css`
      width: 340px;
      min-height: 55px;
      right: 8px;
      bottom: ${BOTTOM_MARGIN}px;
      max-width: 90vw;
      height: fit-content;
    `}
  ${(props) =>
    props.$collapsedState === ComposeExpandTypes.Expanded &&
    css`
      width: 45vw;
      min-width: 624px;
      right: 8px;
      bottom: ${BOTTOM_MARGIN}px;
      max-width: 90vw;
      max-height: 780px;
      height: ${`calc(100vh - ${2 * BOTTOM_MARGIN}px)`};
      transform: translateY(0%) !important;
    `}
  ${(props) =>
    props.$collapsedState === ComposeExpandTypes.FullExpanded &&
    css`
      width: 80vw;
      max-width: 1200px;
      right: 0;
      left: 0;
      margin-left: auto;
      margin-right: auto;
      top: 50%;
      transform: translateY(-50%) !important;
    `}
  box-sizing: border-box;
  box-shadow: var(--shadow-l3);
  border: 1px solid var(--border-secondary);
  border-radius: 20px;
  position: fixed;
  z-index: 999;
  background: var(--bg-l2-solid);
  // Hide scrollbar
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

type ComposePanelProps = {
  children: React.ReactNode;
  open: boolean;
};

const ComposePanel: React.FC<ComposePanelProps> = (props: ComposePanelProps) => {
  const { children, open } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const { composeCollapseState, isSending } = useAppSelector((state) => state.modal);

  const collapsed = composeCollapseState === ComposeExpandTypes.Collapsed;
  const fullExpanded = composeCollapseState === ComposeExpandTypes.FullExpanded;
  const container = {
    hidden: {
      opacity: 0,
      y: 20
    },
    show: {
      opacity: 1,
      y: 0
    }
  };

  if (isSending) return null;
  return (
    <AnimatePresence>
      {open && (
        <>
          {fullExpanded && (
            <BackgroundBlocker
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              transition={{ duration: collapsed ? 0 : 0.2 }}
            />
          )}
          <ComposePanelContainer
            $collapsedState={composeCollapseState}
            animate='show'
            exit='hidden'
            initial='hidden'
            ref={containerRef}
            transition={{
              ease: [1, 0, 0, 1],
              opacity: {
                duration: 0
              },
              y: {
                duration: 0.1
              }
            }}
            variants={container}
          >
            {children}
          </ComposePanelContainer>
        </>
      )}
    </AnimatePresence>
  );
};

export default ComposePanel;
