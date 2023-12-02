import { Editor } from '@tiptap/core';
import {
  DROPDOWN_CALLER_CLASSNAME,
  getThemedColor,
  InputField,
  Portal,
  ThemeMode,
  useOnClickOutside
} from 'nightwatch-ui';
import { ChangeEvent, FC, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useGetPopupPosition } from '../mailEditorUtils';
import { TOOLBAR_CONTAINER } from '../ToolBar/ToolBar';

const Container = styled.div<{ $first: boolean }>`
  position: absolute;
  z-index: 999999999999;

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 4px;
  gap: 10px;

  background: var(--bg-emphasis);
  border: 1px solid ${getThemedColor('var(--border-tertiary)', ThemeMode.DARK)};
  border-radius: 14px;
  ${(props) => props.$first && 'opacity: 0;'}
`;
const StyledInputField = styled(InputField)`
  border-radius: 8px !important;
`;

interface LinkCreatePopupProps {
  editor: Editor;
  editorContainerRef: React.RefObject<HTMLDivElement>;
}

const LINK_WIDTH = 206;

/**
 * This is the create link popup that opens when clicking the link button
 */
const LinkCreatePopup: FC<LinkCreatePopupProps> = ({ editor, editorContainerRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { showFormatBar } = useAppSelector((state) => state.modal);
  const [first, setFirst] = useState<boolean>(true);
  const [href, setHref] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const closePopup = () => {
    editor.commands.closeLinkCreatePopup();
    editor.commands.focus('end');
  };

  const createLink = () => {
    editor.commands.setLink({ href });
  };

  useOnClickOutside(containerRef, closePopup);

  const position = useGetPopupPosition(editor, containerRef, editorContainerRef, TOOLBAR_CONTAINER, showFormatBar);

  useEffect(() => {
    // Instead of autoFocus, Focus without scroll
    if (inputRef.current && editorContainerRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [inputRef.current]);

  // Handle transition
  useEffect(() => {
    setTimeout(() => {
      setFirst(false);
    }, 100);
  }, []);

  return (
    <Portal>
      <Container
        $first={first}
        className={DROPDOWN_CALLER_CLASSNAME}
        ref={containerRef}
        style={{ top: position.top, left: position.left + (position.width - LINK_WIDTH) }}
      >
        <StyledInputField
          forceTheme={ThemeMode.DARK}
          innerRef={inputRef}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setHref(e.target.value);
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onFocus={(e) => {
            e.preventDefault();
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              createLink();
              closePopup();
            }
          }}
          placeholder='Website link'
          value={href}
        />
      </Container>
    </Portal>
  );
};

export default LinkCreatePopup;
