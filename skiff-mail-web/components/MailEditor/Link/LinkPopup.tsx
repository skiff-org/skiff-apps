import { Button, Typography } from '@skiff-org/skiff-ui';
import { Editor } from '@tiptap/core';
import { FC, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useGetPopupPosition } from '../mailEditorUtils';

const Container = styled.div<{ first: boolean }>`
  position: absolute;

  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: fit-content;
  min-width: 200px;

  padding: 5px 10px;

  gap: 10px;

  border-radius: 30px;
  opacity: 1;
  background-color: var(--bg-l1-solid);
  box-shadow: var(--shadow-l2);
  border: 1px solid var(--border-secondary);
  ${(props) => !props.first && 'transition: all 400ms;'}
`;

interface LinkCreatePopupProps {
  editor: Editor;
  editorBoundingRect: DOMRect | undefined;
  editorContainerRef: React.RefObject<HTMLDivElement>;
}

/**
 * This is the popup that opens when hovering/clicking a link
 */
const LinkPopup: FC<LinkCreatePopupProps> = ({ editor, editorBoundingRect, editorContainerRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [first, setFirst] = useState<boolean>(true);

  const href: string = editor.getAttributes('link').href;

  const position = useGetPopupPosition(editor, editorBoundingRect, containerRef, editorContainerRef);

  // Handle transition
  useEffect(() => {
    setTimeout(() => {
      setFirst(false);
    }, 400);
  }, []);

  return (
    <Container ref={containerRef} style={{ left: position.left, top: position.top }} first={first}>
      <Typography
        color='link'
        onClick={() => {
          const withHttp = href.startsWith('http') ? href : `https://${href}`;
          window.open(withHttp, '_blank');
        }}
      >
        {href}
      </Typography>
      <Button
        onClick={() => {
          editor.commands.unsetLink();
        }}
        size='small'
      >
        Remove link
      </Button>
    </Container>
  );
};

export default LinkPopup;
