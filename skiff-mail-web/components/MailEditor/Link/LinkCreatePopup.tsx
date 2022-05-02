import { Button, InputField } from '@skiff-org/skiff-ui';
import { Editor } from '@tiptap/core';
import { FC, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { useGetPopupPosition } from '../mailEditorUtils';
import { useOnClickOutside } from '../mailEditorUtils/useClickOutside';

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
  background-color: var(--bg-l1-solid);
  box-shadow: var(--shadow-l2);
  border: 1px solid var(--border-secondary);

  transition: top 400ms;
`;

interface LinkCreatePopupProps {
  editor: Editor;
  editorBoundingRect: DOMRect | undefined;
  editorContainerRef: React.RefObject<HTMLDivElement>;
}

/**
 * This is the create link popup that opens when clicking the link button
 */
const LinkCreatePopup: FC<LinkCreatePopupProps> = ({ editor, editorBoundingRect, editorContainerRef }) => {
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

  const position = useGetPopupPosition(editor, editorBoundingRect, containerRef, editorContainerRef);

  useEffect(() => {
    // Instead of autoFocus, Focus without scroll
    if (inputRef.current && editorContainerRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [inputRef.current]);

  return (
    <Container ref={containerRef} style={{ top: position.top, left: position.left }}>
      <InputField
        onChange={(e) => {
          setHref(e.target.value);
        }}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            createLink();
            closePopup();
          }
        }}
        onFocus={(e) => {
          e.preventDefault();
        }}
        showErrorMessages={false}
        size='small'
        innerRef={inputRef}
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
