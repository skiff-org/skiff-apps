import { Editor } from '@tiptap/core';
import { AnimatePresence, motion } from 'framer-motion';
import { isEqual } from 'lodash';
import { FC, useCallback, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { insertIf } from 'skiff-utils';
import styled from 'styled-components';

import { isSelectionNotEmpty } from '../mailEditorUtils';

import { allListCommandsGroup, allMarkCommandsGroup, allNodeCommandsGroup, ToolBarCommandGroup } from './commands';
import ToolBarGroup from './ToolBarGroup';

const ToolBarOuterContainer = styled(motion.div)`
  position: fixed;
  width: 100%;
  height: 0px;
  justify-content: center;
  align-items: center;
  transition: all 0 ease-out;
`;

const ToolBarContainer = styled.div`
  display: flex;
  width: fit-content;
  height: 39px;

  border-radius: 8px;
  transform: translateY(calc(-100% - 10px));
  background: var(--bg-emphasis);
  padding: 0px 4px;
  align-items: center;

  -webkit-backdrop-filter: blur(72px);
  backdrop-filter: blur(72px);
  & .icon-button {
    border-radius: 4px !important;
  }
`;

const ToolBarGroupDivider = styled.div`
  width: 1px;
  margin-top: 6px;
  margin-bottom: 6px;
  box-sizing: border-box;
  background: var(--border-secondary);
`;

const CommandsGroupContainer = styled.div`
  display: flex;
  gap: 4px;
`;

const getToolbarCommands = (editor): ToolBarCommandGroup[] => {
  const insideListItem = editor && editor.isActive('listItem');

  return insideListItem
    ? [...insertIf(isMobile, allNodeCommandsGroup), allListCommandsGroup, allMarkCommandsGroup]
    : [...insertIf(isMobile, allNodeCommandsGroup), allMarkCommandsGroup];
};

interface ToolBarProps {
  editor: Editor;
  editorBoundingRect: DOMRect | undefined;
  preventFloating?: boolean;
}

const ToolBar: FC<ToolBarProps> = ({ editor, editorBoundingRect, preventFloating = false }) => {
  const [position, setPosition] = useState<{ bottom: number | string; left: number | string }>({ bottom: 65, left: 0 });

  const calculatePosition = useCallback(
    (_editor: Editor, _editorBoundingRect: DOMRect | undefined, _preventFloating = false) => {
      const selectionCoords = _editor.view.coordsAtPos(_editor.view.state.selection.from);
      return {
        bottom: (_editorBoundingRect?.bottom || 0) - selectionCoords.bottom + 100,
        left: `calc(${selectionCoords.left - (_editorBoundingRect?.left || 0)}px)`
      };
    },
    []
  );

  useEffect(() => {
    const newPos = calculatePosition(editor, editorBoundingRect, preventFloating);
    if (!isEqual(newPos, position)) {
      setPosition(newPos);
    }
  }, [calculatePosition, editor, editorBoundingRect, position, preventFloating]);

  const showFormatBar = isSelectionNotEmpty(editor) && !preventFloating;
  if (!showFormatBar || isMobile) return null;

  return (
    <AnimatePresence>
      <ToolBarOuterContainer
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        style={position}
        transition={{ duration: 0.15 }}
      >
        <ToolBarContainer>
          {getToolbarCommands(editor).map((commandGroup, index) => (
            <CommandsGroupContainer key={index}>
              {index > 0 && <ToolBarGroupDivider />}
              <ToolBarGroup commands={commandGroup.commands} editor={editor} type={commandGroup.type} />
            </CommandsGroupContainer>
          ))}
        </ToolBarContainer>
      </ToolBarOuterContainer>
    </AnimatePresence>
  );
};

export default ToolBar;
