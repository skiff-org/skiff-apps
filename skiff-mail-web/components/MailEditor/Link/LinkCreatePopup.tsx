import { Editor } from '@tiptap/core';
import {
  getThemedColor,
  InputField,
  Portal,
  ThemeMode,
  useOnClickOutside,
  DROPDOWN_CALLER_CLASSNAME
} from 'nightwatch-ui';
import { FC, useEffect, useRef, useState, ChangeEvent } from 'react';
import styled from 'styled-components';

import { useGetPopupPosition } from '../mailEditorUtils';
import { TOOLBAR_CONTAINER } from '../ToolBar/ToolBar';

const Container = styled.div`
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

  const position = useGetPopupPosition(editor, containerRef, editorContainerRef, TOOLBAR_CONTAINER);

  useEffect(() => {
    // Instead of autoFocus, Focus without scroll
    if (inputRef.current && editorContainerRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [inputRef.current]);

  return (
    <Portal>
      <Container
        className={DROPDOWN_CALLER_CLASSNAME}
        ref={containerRef}
        style={{ top: position.top, left: position.left + (position.width - LINK_WIDTH) }}
      >
        <InputField
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
