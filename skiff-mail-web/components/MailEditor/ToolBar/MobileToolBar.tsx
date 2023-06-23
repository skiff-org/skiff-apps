import { Editor } from '@tiptap/react';
import { Icon, IconButton, Size, Typography } from '@skiff-org/skiff-ui';
import { MouseEventHandler, useEffect, useState } from 'react';
import { isIOS } from 'react-device-detect';
import styled from 'styled-components';

import { useIosKeyboardHeight } from '../../../hooks/useIosKeyboardHeight';

import { bold, headings, italic, paragraph, ToolBarCommand } from './commands';

export const MOBILE_TOOLBAR_HEIGHT = 44;
const IconButtonWidth = 38;
const ActionBarContainer = styled.div<{ keyboardHeight: number; show: boolean }>`
  height: ${MOBILE_TOOLBAR_HEIGHT}px;
  width: 100vw;
  justify-content: space-between;
  flex-direction: row;
  position: absolute;
  backdrop-filter: blur(72px);
  background: var(--bg-l1-glass) !important;
  padding: 4px 12px;
  box-sizing: border-box;
  border-top: 1px solid var(--border-secondary);
  left: 0;
  transition: bottom cubic-bezier(0.38, 0.7, 0.125, 1) 345ms; // https://developer.apple.com/forums/thread/48088
  bottom: ${(props) => props.keyboardHeight}px;
  ${(props) => (!props.show ? 'display: none;' : 'display: flex;')}
  // When not showing be behind compose drawer and disable pointer events
  ${(props) => {
    if (props.show) return 'z-index: 2000;';
    return `
      z-index: 0;
      pointer-events: none;
    `;
  }}
  overflow: hidden;
  align-items: center;
`;

const ActionBarButtonsScrollView = styled.div`
  box-sizing: border-box;
  display: flex;
`;

const ButtonGroup = styled.div<{ hide: boolean }>`
  ${(props) => `display: ${props.hide ? 'none' : 'flex'};`}
  // Disable click on children buttons when hidden
  ${(props) =>
    props.hide &&
    `
    * {
      pointer-events: none;
    }
  `}
  width: fit-content;
  flex-direction: row;
  align-items: center;
`;

const ActionBarButtons = styled.div<{ showFormatting: boolean; translateBy: number }>`
  display: flex;
  flex-direction: row;
`;

interface ActionBarProps {
  editor: Editor;
  optionButtons: JSX.Element[]; // all non formatting buttons such as add attachments, discard draft
}

// ActionBar for native mobile app
export function MobileComposeToolbar({ editor, optionButtons }: ActionBarProps) {
  const iosKeyboardHeight = useIosKeyboardHeight('action-bar');
  const [showFormatting, setShowFormatting] = useState(false);

  const onTextClick = () => {
    setShowFormatting((prev) => !prev);
  };

  const onActionBarContainerMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
    // Don't close keyboard when clicking on action bar
    e.preventDefault();
  };

  useEffect(() => {
    // Whenever toolbar is not showing, reset formatting state
    if (!editor.isFocused) {
      setShowFormatting(false);
    }
  }, [editor.isFocused]);

  const formattingButtonsArray = [paragraph, bold, italic, headings[0], headings[1], headings[2]];

  const formattingButtons = formattingButtonsArray
    .filter((cmd): cmd is ToolBarCommand => !!cmd)
    .map(({ icon, command, active, enabled }, index) => {
      return (
        <IconButton
          active={active(editor)}
          disabled={!enabled(editor)}
          icon={icon}
          key={`mobile-toolbar-button-${index}`}
          onClick={() => command(editor)}
          size={Size.LARGE}
        />
      );
    });

  return (
    <>
      <ActionBarContainer
        keyboardHeight={editor.isFocused ? iosKeyboardHeight : 0}
        onMouseDown={onActionBarContainerMouseDown}
        show={isIOS ? editor.isFocused && !!iosKeyboardHeight : !!editor.isFocused}
      >
        <ActionBarButtonsScrollView>
          <ActionBarButtons
            showFormatting={showFormatting}
            translateBy={(formattingButtons.length + 1) * IconButtonWidth} // Translate by width of formatting buttons + 1 (the arrow/text button)
          >
            {/* Headers, bold, italic, etc.. */}
            <ButtonGroup hide={!showFormatting}>{formattingButtons}</ButtonGroup>
            {/* Show formatting toggle */}
            <IconButton icon={!showFormatting ? Icon.Text : Icon.ArrowRight} onClick={onTextClick} size={Size.LARGE} />
            {/* Add attachment, image, link, or discard draft */}
            <ButtonGroup hide={showFormatting}>{optionButtons}</ButtonGroup>
          </ActionBarButtons>
        </ActionBarButtonsScrollView>
        <div onClick={editor.commands.blur}>
          <Typography color='link'>Done</Typography>
        </div>
      </ActionBarContainer>
    </>
  );
}
