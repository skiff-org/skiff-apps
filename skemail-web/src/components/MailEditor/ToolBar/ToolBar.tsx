import { Editor } from '@tiptap/react';
import { AnimatePresence, motion } from 'framer-motion';
import isEqual from 'lodash/isEqual';
import { ACCENT_COLOR_VALUES, getThemedColor, Icon, Icons, ThemeMode } from 'nightwatch-ui';
import { FC, useCallback, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { HIGHLIGHT_COLORS, TEXT_COLORS } from 'skiff-front-utils';
import { insertIf } from 'skiff-utils';
import styled from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { isSelectionNotEmpty, toggleColor } from '../mailEditorUtils';

import { allListCommandsGroup, allMarkCommandsGroup, allNodeCommandsGroup, ToolBarCommandGroup } from './commands';
import { clearFormatCommandGroup } from './commands/clearFormat';
import { toggleLinkCommandGroup } from './commands/link';
import { allTextCommandsGroup } from './commands/text';
import ToolBarGroup from './ToolBarGroup';

const ToolBarOuterContainer = styled.div`
  width: 100%;
  position: relative;
`;

const ToolBarContainerAbsolute = styled(motion.div)`
  position: absolute;
  z-index: 1;
`;

const ToolBarContainer = styled.div`
  display: flex;
  width: fit-content;
  height: fit-content;
  box-sizing: border-box;
  border-radius: 8px;
  transform: translateY(calc(-100% - 10px));
  background: var(--bg-emphasis);
  padding: 2px;
  align-items: center;
  border: 1px solid ${getThemedColor('var(--border-primary)', ThemeMode.DARK)};
  box-shadow: var(--shadow-l2);

  & .icon-button {
    border-radius: 4px !important;
  }
`;

const CurrentTextColorCircle = styled.div`
  display: flex;
  align-items: center;
`;

const CurrentTextColor = styled.span<{ $textColor: string }>`
  height: 18px;
  width: 18px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  border: 1px solid ${getThemedColor('var(--border-primary)', ThemeMode.DARK)};
  ${(props) => `background: ${props.$textColor}`};
`;

const ToolBarGroupDivider = styled.div`
  width: 1px;
  height: 24px;
  margin: 4px;
  box-sizing: border-box;
  background: ${getThemedColor('var(--border-primary)', ThemeMode.DARK)};
`;

const CommandsGroupContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0px;
`;

const ColorSelect = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 6px;
  box-sizing: border-box;
  gap: 2px;
  height: 32px;

  cursor: pointer;
  border-radius: 6px;
  &:hover {
    background: ${getThemedColor('var(--bg-overlay-secondary)', ThemeMode.DARK)};
  }
`;

export const getToolbarCommands = (editor: Editor, showFormatBar?: boolean): ToolBarCommandGroup[] => {
  const insideListItem = editor && editor.isActive('listItem');
  const insideLink = editor && editor.isActive('link');

  return [
    allNodeCommandsGroup,
    ...insertIf(insideListItem && !showFormatBar, allListCommandsGroup),
    allMarkCommandsGroup,
    allTextCommandsGroup,
    ...insertIf(!insideLink, toggleLinkCommandGroup),
    clearFormatCommandGroup,
    ...insertIf(insideListItem && !!showFormatBar, allListCommandsGroup)
  ];
};

export const getColor = (editor: Editor) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const activeColors = Object.keys(TEXT_COLORS).filter((color) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    editor.isActive('textStyle', { color: TEXT_COLORS?.[color] })
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const customColor = editor.getAttributes('textStyle').color as string;
  let color = customColor || 'var(--text-always-white)';

  if (activeColors.length === 1) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
    color = TEXT_COLORS[activeColors[0] ?? ''] ?? 'var(--text-always-white)';
  }

  return {
    value: color,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    name: Object.keys(ACCENT_COLOR_VALUES).find((key) => ACCENT_COLOR_VALUES?.[key]?.[0] === color) || customColor || ''
  };
};

export const getHighlightColor = (editor: Editor) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const activeColors = Object.keys(HIGHLIGHT_COLORS).filter((color) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    editor.isActive('highlight', { color: HIGHLIGHT_COLORS?.[color] })
  );
  const customColor = editor.getAttributes('highlight').color as string;
  let color = customColor || 'transparent';

  if (activeColors.length === 1) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    color = HIGHLIGHT_COLORS[activeColors[0] ?? ''] ?? 'transparent';
  }
  return {
    value: color,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    name: Object.keys(ACCENT_COLOR_VALUES).find((key) => ACCENT_COLOR_VALUES?.[key]?.[1] === color) || customColor || ''
  };
};

interface ToolBarProps {
  editor: Editor;
  editorBoundingRect: DOMRect | undefined;
  preventFloating?: boolean;
}

export const TOOLBAR_COLOR_CMDS = 'toolbar-color-cmds';
export const TOOLBAR_CONTAINER = 'toolbar-container';
const TOOLBAR_MAX_WIDTH = 508;
const TOOLBAR_MAX_HEIGHT = 48;
const TOOLBAR_INCREMENT = TOOLBAR_MAX_HEIGHT / 4;

const ToolBar: FC<ToolBarProps> = ({ editor, editorBoundingRect, preventFloating = false }) => {
  const [position, setPosition] = useState<{
    top?: number | string;
    bottom?: number | string;
    left?: number | string;
    right?: number | string;
  }>({
    top: 0,
    bottom: 65,
    left: 0
  });

  const { showFormatBar } = useAppSelector((state) => state.modal);

  const calculatePosition = useCallback(
    (_editor: Editor, _editorBoundingRect: DOMRect | undefined, _preventFloating = false) => {
      const selectionCoords = _editor.view.coordsAtPos(_editor.view.state.selection.from);
      const verticalOffset = 100;
      const rightOverflow = selectionCoords.right + TOOLBAR_MAX_WIDTH > window.innerWidth;
      const topOverflow = selectionCoords.top - TOOLBAR_MAX_HEIGHT < (_editorBoundingRect?.top || 0);
      const top = selectionCoords.top - (_editorBoundingRect?.top || 0);

      return {
        top: top + (topOverflow ? TOOLBAR_INCREMENT * 5 : -TOOLBAR_INCREMENT),
        bottom: (_editorBoundingRect?.bottom || 0) - selectionCoords.bottom + verticalOffset,
        left: rightOverflow ? undefined : `calc(${selectionCoords.left - (_editorBoundingRect?.left || 0)}px)`,
        right: rightOverflow ? '8px' : undefined
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

  const showSelectFormatBar = isSelectionNotEmpty(editor) && !preventFloating;

  useEffect(() => {
    if (!showSelectFormatBar) {
      editor.commands.closeColorPopup();
    }
  }, [showSelectFormatBar]);

  if (!showSelectFormatBar || isMobile) return null;

  const commands = getToolbarCommands(editor, showFormatBar);
  const [textType, ...rest] = commands;

  return (
    <AnimatePresence>
      <ToolBarOuterContainer>
        <ToolBarContainerAbsolute style={position}>
          <ToolBarContainer id={TOOLBAR_CONTAINER}>
            {textType && (
              <CommandsGroupContainer>
                <ToolBarGroup commands={textType.commands} editor={editor} type={textType.type} />
              </CommandsGroupContainer>
            )}
            <CommandsGroupContainer>
              <ToolBarGroupDivider />
              <ColorSelect onClick={() => toggleColor(editor)}>
                <CurrentTextColorCircle>
                  {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
                  <CurrentTextColor $textColor={getColor(editor).value} />
                </CurrentTextColorCircle>
                <Icons color='secondary' forceTheme={ThemeMode.DARK} icon={Icon.ChevronDown} />
              </ColorSelect>
            </CommandsGroupContainer>
            {rest.map((commandGroup, index) => (
              <CommandsGroupContainer key={index}>
                <ToolBarGroupDivider />
                <ToolBarGroup commands={commandGroup.commands} editor={editor} type={commandGroup.type} />
              </CommandsGroupContainer>
            ))}
          </ToolBarContainer>
        </ToolBarContainerAbsolute>
      </ToolBarOuterContainer>
    </AnimatePresence>
  );
};

export default ToolBar;
