import { Editor } from '@tiptap/core';
import {
  Icon,
  IconButton,
  Typography,
  Type,
  getThemedColor,
  ThemeMode,
  DROPDOWN_CALLER_CLASSNAME
} from '@skiff-org/skiff-ui';
import { FC, useRef } from 'react';
import styled from 'styled-components';

import { useGetSelectionPosition } from '../mailEditorUtils';

const Container = styled.div`
  position: absolute;
  z-index: 999999999999;

  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: fit-content;
  padding: 4px;
  gap: 10px;

  border-radius: 12px;
  max-width: 300px;
  opacity: 1;
  background: var(--bg-emphasis);
  border: 1px solid ${getThemedColor('var(--border-tertiary)', ThemeMode.DARK)};
  box-shadow: var(--shadow-l2);
`;

const PaddedTypography = styled.div`
  padding: 8px;
  overflow: hidden;
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const href: string = editor.getAttributes('link').href;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const position = useGetSelectionPosition(editor, containerRef, editorContainerRef);

  return (
    <Container
      className={DROPDOWN_CALLER_CLASSNAME}
      ref={containerRef}
      style={{ left: position.left, top: position.top }}
    >
      <PaddedTypography>
        <Typography
          color='link'
          forceTheme={ThemeMode.DARK}
          onClick={() => {
            const withHttp = href.startsWith('http') ? href : `https://${href}`;
            window.open(withHttp, '_blank');
          }}
        >
          {href}
        </Typography>
      </PaddedTypography>
      <IconButton
        forceTheme={ThemeMode.DARK}
        icon={Icon.Unlink}
        onClick={() => {
          editor.commands.unsetLink();
        }}
        tooltip='Unlink'
        type={Type.SECONDARY}
      />
    </Container>
  );
};

export default LinkPopup;
