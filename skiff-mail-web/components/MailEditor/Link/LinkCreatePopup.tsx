import { Editor } from '@tiptap/core';
import { Button, InputField, useOnClickOutside } from 'nightwatch-ui';
import { FC, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { useGetPopupPosition } from '../mailEditorUtils';

const Container = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;

  padding: 5px 10px;

  gap: 10px;

  border-radius: 30px;
  opacity: 1;
  background: var(--bg-l1-solid);
  box-shadow: var(--shadow-l2);
  border: 1px solid var(--border-secondary);
`;

interface LinkCreatePopupProps {
  editor: Editor;
  editorContainerRef: React.RefObject<HTMLDivElement>;
}

/**
 * This is the create link popup that opens when clicking the link button
 */
const LinkCreatePopup: FC<LinkCreatePopupProps> = ({ editor, editorContainerRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [href, setHref] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const closePopup = () => {
    editor.commands.closeLinkCreatePopup();
  };

  const createLink = () => {
    editor.commands.setLink({ href });
  };

  useOnClickOutside(containerRef, closePopup);

  const position = useGetPopupPosition(editor, containerRef, editorContainerRef);

  useEffect(() => {
    // Instead of autoFocus, Focus without scroll
    if (inputRef.current && editorContainerRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [inputRef.current]);

  return (
    <Container ref={containerRef} style={{ top: position.top, left: position.left }}>
      <InputField
        innerRef={inputRef}
        onChange={(e) => {
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
        showErrorMessages={false}
        size='small'
        value={href}
      />
      <Button
        disabled={!href.trim()}
        onClick={() => {
          createLink();
          closePopup();
        }}
        size='small'
      >
        Link
      </Button>
    </Container>
  );
};

export default LinkCreatePopup;
