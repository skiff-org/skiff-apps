import { Editor, EditorContent } from '@tiptap/react';
import { FC, KeyboardEventHandler, useEffect, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import { LinkCreatePopup, linkCreatePopupPluginKey, LinkPopup } from './Link';
import { ToolBar } from './ToolBar';

const MailEditorInputContainer = styled.div<{ isMobile?: boolean }>`
  min-height: ${(props) => (props.isMobile ? '0px' : '200px')};
  max-height: 30vh;
  width: 100%;
  position: relative;
  overflow-y: auto;
`;

interface MailEditorProps {
  showToolbar: boolean;
  editor: Editor;
  isFocused: boolean;
}

const MailEditor: FC<MailEditorProps> = ({ showToolbar, editor, isFocused }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const linkCreateOpen = linkCreatePopupPluginKey.getState(editor.view.state)?.open;

  const editorBoundingRect = containerRef.current?.getBoundingClientRect();

  const ignoreTab: KeyboardEventHandler<HTMLDivElement> = (e) => {
    // When tab is pressed in mail editor, do not focus on URL bar
    if (e.key === 'Tab') {
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (isFocused) {
      editor?.commands.focus();
    }
  }, [isFocused, editor?.commands]);

  return (
    <MailEditorInputContainer
      isMobile={isMobile}
      onClick={() => editor?.commands.focus()}
      onKeyDown={ignoreTab}
      ref={containerRef}
    >
      {editor && <EditorContent editor={editor} />}
      {showToolbar && !linkCreateOpen && editor && (
        <ToolBar editor={editor} editorBoundingRect={editorBoundingRect} preventFloating={editor.isActive('link')} />
      )}
      {linkCreateOpen && (
        <LinkCreatePopup editor={editor} editorBoundingRect={editorBoundingRect} editorContainerRef={containerRef} />
      )}
      {editor.isActive('link') && (
        <LinkPopup editor={editor} editorBoundingRect={editorBoundingRect} editorContainerRef={containerRef} />
      )}
    </MailEditorInputContainer>
  );
};

export default MailEditor;
