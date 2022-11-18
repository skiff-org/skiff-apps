import { Content, Editor, EditorContent, useEditor } from '@tiptap/react';
import applyProsemirrorDevtools from 'prosemirror-dev-tools';
import { Dispatch, FC, KeyboardEventHandler, MutableRefObject, SetStateAction, useEffect, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { isMobileApp } from 'skiff-front-utils';
import styled from 'styled-components';

import { useIosKeyboardHeight } from '../../hooks/useIosKeyboardHeight';
import { DesktopMotionDiv } from '../DesktopMotionDiv';

import { buildEditorExtensions, EditorExtensionsOptions } from './Extensions';
import { LinkCreatePopup, linkCreatePopupPluginKey, LinkPopup } from './Link';
import { ToolBar } from './ToolBar';
import { MobileComposeToolbar, MOBILE_TOOLBAR_HEIGHT } from './ToolBar/MobileToolBar';

export const MAIL_EDITOR_MIN_HEIGHT = 200;

const MailEditorInputContainer = styled(DesktopMotionDiv)<{ hasAttachments?: boolean }>`
  min-height: ${isMobile ? '0px' : `${MAIL_EDITOR_MIN_HEIGHT}px`};
  max-height: 30vh;
  width: 100%;
  overflow-y: auto;
  padding-top: 16px;
  position: relative;
  ${isMobile &&
  `
    overflow-y: unset;
    max-height: unset;
    overflow-x: hidden;
  `}
  // When we have attachments give min height for compose body for making attechments at the bottom (calc: size screen - header height - attechmetns height)
  // TODO: move it to js vars
  ${(props) => (props.hasAttachments && isMobile ? 'min-height: calc(100vh - 270px - 150px);' : '')}
`;

interface MailEditorProps {
  /**
   * wether email has attachments or not
   */
  hasAttachments: boolean;
  /**
   * ref for editor object. Can be used or external checks / actions
   */
  editorRef: MutableRefObject<Editor | null>;
  /**
   * ondrop events handler
   */
  onDrop?: React.DragEventHandler;
  /**
   * called when the content is created
   */
  onCreate?: (editor: Editor) => void;
  /**
   * called every time the content changed
   *
   * This should be used only for things external to the editor that need the update
   *
   */
  onChange?: (editor: Editor) => void;
  /**
   * set dirty state of mail editor for *external* use
   */
  setIsEditorDirty?: Dispatch<SetStateAction<boolean>> | ((isDirty: boolean) => void);
  /**
   * callback to call once when editor is focused
   */
  onFocus?: () => void;
  /**
   * callback to call when editor is blurred
   */
  onBlur?: () => void;
  /**
   * defaults to empty
   */
  initialHtmlContent?: Content;
  /**
   * all custom extensions options
   */
  extensionsOptions?: EditorExtensionsOptions;
  /**
   * toolbar option buttons for editor
   */
  mobileToolbarButtons: JSX.Element[];
}

const MailEditor: FC<MailEditorProps> = ({
  editorRef,
  hasAttachments,
  onDrop,
  onChange,
  onCreate,
  onFocus,
  onBlur,
  setIsEditorDirty,
  initialHtmlContent,
  extensionsOptions,
  mobileToolbarButtons
}) => {
  const iosKeyboardHeight = useIosKeyboardHeight('compose-editor-container');

  const editor = useEditor({
    editable: true,
    extensions: buildEditorExtensions(extensionsOptions),
    onTransaction: ({ transaction }) => {
      if (transaction.docChanged && !transaction.getMeta('preventUpdate')) {
        // Set dirty only when docChanged and ignore cases where it wasn't a user's trans
        setIsEditorDirty?.(true);
      }
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onChange?.(updatedEditor as Editor);
    },
    content: initialHtmlContent,
    onFocus: () => {
      onFocus?.();
    },
    onBlur: () => {
      onBlur?.();
    },
    onCreate({ editor: createdEditor }) {
      if (process.env.PM_DEVTOOLS) applyProsemirrorDevtools(createdEditor.view);
      onCreate?.(createdEditor as Editor);
      onChange?.(createdEditor as Editor);
    }
  });

  if (editor) editorRef.current = editor;

  useEffect(() => {
    // add merging for editor to keep the cursor above keyboard when active
    if (editor) {
      editor.setOptions({
        editorProps: {
          scrollThreshold: { top: 0, bottom: iosKeyboardHeight + MOBILE_TOOLBAR_HEIGHT, right: 0, left: 0 },
          scrollMargin: { top: 0, bottom: iosKeyboardHeight + MOBILE_TOOLBAR_HEIGHT, right: 0, left: 0 }
        }
      });
    }
  }, [iosKeyboardHeight, editor]);

  const keyboardPaddingOffset =
    isMobileApp() && editor?.isFocused ? iosKeyboardHeight + MOBILE_TOOLBAR_HEIGHT : iosKeyboardHeight;

  const containerRef = useRef<HTMLDivElement>(null);

  const linkCreateOpen = editor ? linkCreatePopupPluginKey.getState(editor.view.state)?.open : undefined;

  const editorBoundingRect = containerRef.current?.getBoundingClientRect();

  const ignoreTab: KeyboardEventHandler<HTMLDivElement> = (e) => {
    // When tab is pressed in mail editor, do not focus on URL bar
    if (e.key === 'Tab') {
      e.preventDefault();
    }
    // Remove focus from body when Escape is pressed
    if (e.key === 'Escape') {
      editor?.commands.blur();
    }
  };

  return (
    editor && (
      <>
        <MailEditorInputContainer
          data-test='compose-editor'
          hasAttachments={hasAttachments}
          initial={false}
          layout
          onClick={() => editor?.commands.focus()}
          onDrop={onDrop}
          onKeyDown={ignoreTab}
          ref={containerRef}
          style={{ paddingBottom: keyboardPaddingOffset }}
        >
          {editor && <EditorContent editor={editor} />}
          {!linkCreateOpen && editor && (
            <ToolBar
              editor={editor}
              editorBoundingRect={editorBoundingRect}
              preventFloating={editor.isActive('link')}
            />
          )}
          {linkCreateOpen && <LinkCreatePopup editor={editor} editorContainerRef={containerRef} />}
          {editor.isActive('link') && <LinkPopup editor={editor} editorContainerRef={containerRef} />}
        </MailEditorInputContainer>
        {isMobile && editor.isFocused && <MobileComposeToolbar editor={editor} optionButtons={mobileToolbarButtons} />}
      </>
    )
  );
};

export default MailEditor;
