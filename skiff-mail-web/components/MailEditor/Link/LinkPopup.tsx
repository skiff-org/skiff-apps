import { Editor } from '@tiptap/core';
import { IconButton, Icon, Typography } from 'nightwatch-ui';
import { FC, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { useGetPopupPosition } from '../mailEditorUtils';

const Container = styled.div<{ first: boolean }>`
  position: absolute;

  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: fit-content;

  padding: 2px 8px;

  gap: 10px;

  border-radius: 12px;
  max-width: 300px;
  opacity: 1;
  background: var(--bg-l1-solid);
  box-shadow: var(--shadow-l2);
  border: 1px solid var(--border-secondary);
  ${(props) => !props.first && 'transition: all 400ms;'}
`;

interface LinkCreatePopupProps {
  editor: Editor;
  editorContainerRef: React.RefObject<HTMLDivElement>;
}

/**
 * This is the popup that opens when hovering/clicking a link
 */
const LinkPopup: FC<LinkCreatePopupProps> = ({ editor, editorContainerRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [first, setFirst] = useState<boolean>(true);

  const href: string = editor.getAttributes('link').href;

  const position = useGetPopupPosition(editor, containerRef, editorContainerRef);

  // Handle transition
  useEffect(() => {
    setTimeout(() => {
      setFirst(false);
    }, 400);
  }, []);

  return (
    <Container first={first} ref={containerRef} style={{ left: position.left, top: position.top }}>
      <Typography
        color='link'
        onClick={() => {
          const withHttp = href.startsWith('http') ? href : `https://${href}`;
          window.open(withHttp, '_blank');
        }}
      >
        {href}
      </Typography>
      <IconButton
        color='secondary'
        icon={Icon.Unlink}
        onClick={() => {
          editor.commands.unsetLink();
        }}
        tooltip='Unlink'
      />
    </Container>
  );
};

export default LinkPopup;
