import { Editor } from '@tiptap/core';
import { FC } from 'react';
import styled from 'styled-components';

import { isSelectionNotEmpty } from '../mailEditorUtils';
import { allListCommandsGroup, allMarkCommandsGroup, allNodeCommandsGroup, ToolBarCommandGroup } from './commands';
import ToolBarGroup from './ToolBarGroup';

const ToolBarOuterContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 0px;

  display: flex;
  justify-content: center;
  align-items: center;

  transition: all 200ms ease-out;
`;

const ToolBarContainer = styled.div`
  display: flex;
  width: fit-content;
  height: 39px;

  border-radius: 8px;
  transform: translateY(calc(-100% - 10px));
  background-color: var(--bg-emphasis);
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
    ? [allNodeCommandsGroup, allListCommandsGroup, allMarkCommandsGroup]
    : [allNodeCommandsGroup, allMarkCommandsGroup];
};

interface ToolBarProps {
  editor: Editor;
  editorBoundingRect: DOMRect | undefined;
  preventFloating?: boolean;
}

const ToolBar: FC<ToolBarProps> = ({ editor, editorBoundingRect, preventFloating = false }) => (
  <ToolBarOuterContainer
    style={
      isSelectionNotEmpty(editor) && !preventFloating
        ? {
            top: editor.view.coordsAtPos(editor.view.state.selection.from).bottom - (editorBoundingRect?.top || 0),
            left: `calc(-40% + ${
              editor.view.coordsAtPos(editor.view.state.selection.from).left - (editorBoundingRect?.left || 0)
            }px)`
          }
        : {
            top: (editorBoundingRect?.height || 0) + 20,
            left: 0
          }
    }
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
);

export default ToolBar;
