import { motion, AnimatePresence } from 'framer-motion';
import { useOnClickOutside } from 'nightwatch-ui';
import React, { useState, useRef, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { useLocalSetting } from 'skiff-front-utils';
import { DEFAULT_WORKSPACE_EVENT_VERSION } from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import { storeWorkspaceEvent } from '../../../utils/userUtils';

const ActivationPaneToggleWrapper = styled.div<{ $offset: number }>`
  z-index: 2;
  position: absolute;
  right: ${({ $offset }) => $offset + 24}px;
  bottom: 24px;
`;

import ActivationChecklistPane from './ActivationChecklistPane';
import ActivationPaneButton from './ActivationPaneButton';

const ActivationPaneToggleContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
`;

interface ActivationPaneToggleProps {
  rightOffset?: number;
}

/**
 * Wrapper that manages rendering the activation checklist and button to show / hide the pane.
 * Attaches itself to a fixed position in the bottom right of the message list.
 */

const ActivationPaneToggle: React.FC<ActivationPaneToggleProps> = ({ rightOffset = 0 }) => {
  // default to open when user first logs in on new device or session
  const [hasSeenActivationChecklist, setHasSeenActivationChecklist] = useLocalSetting(
    StorageTypes.HAS_SEEN_ACTIVATION_CHECKLIST
  );
  const [paneOpen, setPaneOpen] = useState(!hasSeenActivationChecklist);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasSeenActivationChecklist && !isMobile) {
      setHasSeenActivationChecklist(true);
    }
  }, [hasSeenActivationChecklist, setHasSeenActivationChecklist]);

  useOnClickOutside(containerRef, () => setPaneOpen(false), [], undefined, undefined, !paneOpen);

  return (
    <ActivationPaneToggleWrapper $offset={rightOffset}>
      <ActivationPaneToggleContainer ref={containerRef}>
        <AnimatePresence>
          {paneOpen && (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.95 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.2 }}
            >
              <ActivationChecklistPane />
            </motion.div>
          )}
        </AnimatePresence>
        <ActivationPaneButton
          onClick={() => {
            void storeWorkspaceEvent(
              WorkspaceEventType.ActivationChecklistToggle,
              paneOpen ? 'close' : 'open',
              DEFAULT_WORKSPACE_EVENT_VERSION
            );
            setPaneOpen((prev) => !prev);
          }}
          open={paneOpen}
        />
      </ActivationPaneToggleContainer>
    </ActivationPaneToggleWrapper>
  );
};

export default ActivationPaneToggle;
