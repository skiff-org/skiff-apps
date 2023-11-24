import Placeholder from '@tiptap/extension-placeholder';
import { Content, Editor, EditorContent, useEditor } from '@tiptap/react';
import applyProsemirrorDevtools from 'prosemirror-dev-tools';
import {
  Dispatch,
  FC,
  KeyboardEventHandler,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useRef
} from 'react';
import { isAndroid, isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { isMobileApp } from 'skiff-front-utils';
import styled from 'styled-components';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useIosKeyboardHeight } from '../../hooks/useIosKeyboardHeight';
import { skemailDraftsReducer } from '../../redux/reducers/draftsReducer';
import { ComposeExpandTypes, skemailModalReducer } from '../../redux/reducers/modalReducer';
import { EmailFieldTypes } from '../Compose/Compose.constants';
import FormatOptionsToolbar from '../Compose/FormatOptionsToolbar';

import { ColorPopup } from './Color';
import { buildEditorExtensions, EditorExtensionsOptions } from './Extensions';
import emojiMap from './Extensions/emojiList';
import { PopupPluginType, popupTypePluginKey } from './Extensions/PopupPlugin';
import { LinkCreatePopup, LinkPopup } from './Link';
import { hackFixSamsungKeyboardBug } from './mailEditorUtils/samsungMailFix';
import { ToolBar } from './ToolBar';
import { MobileComposeToolbar, MOBILE_TOOLBAR_HEIGHT } from './ToolBar/MobileToolBar';

const MailEditorInputContainer = styled.div<{
  hasAttachments?: boolean;
  isFullExpanded: boolean;
  $keyboardPaddingOffset: number;
}>`
  width: 100%;
  overflow-y: auto;
  position: relative;
  box-sizing: border-box;

  ${(props) =>
    !props.isFullExpanded &&
    !isMobile &&
    `  height: 100%;
      min-height: 220px;
    `}
  ${(props) =>
    props.isFullExpanded &&
    `  min-height: 40vh;
       max-height: 40vh;
    `}
  ${(props) =>
    isMobile &&
    `
    min-height: 0px;
    padding-top: 16px;
    padding-bottom: ${props.$keyboardPaddingOffset}px;
    overflow-y: unset;
    max-height: unset;
    overflow-x: hidden;
  `}
  ${!isMobile &&
  `  padding: 16px;
    `}
  // When we have attachments give min height for compose body for making attechments at the bottom (calc: size screen - header height - attechmetns height)
  // TODO: move it to js vars
  ${(props) => (props.hasAttachments && isMobile ? 'min-height: calc(100vh - 270px - 150px);' : '')}
`;

const BLOCKQUOTE_REGEX = /\[&quot;blockquote.*?\]/;

const EMOJI_REGEX = /:(\w+):/g;

// absolute max length of emoji code
const MAX_EMOJI_CODE_LEN = 35;

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
   * set ready state of mail editor for *external* use
   */
  setIsEditorReady: Dispatch<SetStateAction<boolean>> | ((isReady: boolean) => void);
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
  /**
   * the compose field that is currently in focus
   */
  focusedField: EmailFieldTypes | null;
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
  setIsEditorReady,
  initialHtmlContent,
  extensionsOptions,
  mobileToolbarButtons,
  focusedField
}) => {
  const isFocused = focusedField === EmailFieldTypes.BODY;
  const isFromFieldFocused = focusedField === EmailFieldTypes.FROM;
  const dispatch = useDispatch();
  const closeCompose = useCallback(() => {
    dispatch(skemailDraftsReducer.actions.clearCurrentDraftID());
    dispatch(skemailModalReducer.actions.closeCompose());
  }, [dispatch]);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const iosKeyboardHeight = useIosKeyboardHeight('compose-editor-container');
  const { composeCollapseState, showFormatBar } = useAppSelector((state) => state.modal);

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
    onFocus,
    onCreate({ editor: createdEditor }) {
      setIsEditorReady(true);
      if (process.env.PM_DEVTOOLS) applyProsemirrorDevtools(createdEditor.view);
      onCreate?.(createdEditor as Editor);
      onChange?.(createdEditor as Editor);
    },
    onDestroy() {
      setIsEditorReady(false);
    }
  });

  if (editor) editorRef.current = editor;

  editor?.on('transaction', ({ editor: curEditor, transaction }) => {
    // Check if the document has changed
    if (transaction.docChanged) {
      const state = editor.state;

      state.doc.descendants((node, pos) => {
        if (node.isText && node.text) {
          let match;
          while ((match = EMOJI_REGEX.exec(node.text)) !== null) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            const emojiCode = match[1];
            if (emojiCode && typeof emojiCode === 'string' && emojiCode.length > MAX_EMOJI_CODE_LEN) {
              return;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            const emoji = emojiMap[emojiCode];
            if (!emoji) {
              return;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/restrict-plus-operands, @typescript-eslint/no-unsafe-member-access
            const from = pos + match.index;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/restrict-plus-operands, @typescript-eslint/no-unsafe-member-access
            const to = from + match[0].length;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const emojiNode = state.schema.text(emoji);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const tr = state.tr.replaceWith(from, to, emojiNode);
            curEditor.view.dispatch(tr);

            // Exit after the first replacement to avoid infinite loops
            return false;
          }
        }
      });
    }
  });

  useEffect(() => {
    // add merging for editor to keep the cursor above keyboard when active
    if (editor) {
      editor.setOptions({
        editorProps: {
          scrollThreshold: { top: 0, bottom: iosKeyboardHeight + MOBILE_TOOLBAR_HEIGHT, right: 0, left: 0 },
          scrollMargin: { top: 0, bottom: iosKeyboardHeight + MOBILE_TOOLBAR_HEIGHT, right: 0, left: 0 },
          transformPastedHTML: (html: string) => {
            // Don't keep blockquote when pasting
            html = html.replace(BLOCKQUOTE_REGEX, '');
            return html;
          }
        }
      });
    }
  }, [iosKeyboardHeight, editor]);

  const keyboardPaddingOffset: number =
    isMobileApp() && editor?.isFocused ? iosKeyboardHeight + MOBILE_TOOLBAR_HEIGHT : iosKeyboardHeight;

  const containerRef = useRef<HTMLDivElement>(null);

  const linkCreateOpen = editor
    ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      popupTypePluginKey.getState(editor.view.state)?.open === PopupPluginType.Link
    : undefined;
  const colorPickerOpen = editor
    ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      popupTypePluginKey.getState(editor.view.state)?.open === PopupPluginType.Color
    : undefined;

  const editorBoundingRect = containerRef.current?.getBoundingClientRect();

  // Removes focus from editor
  const blurEditor = useCallback(() => {
    editor?.commands.blur();
    if (!isFromFieldFocused) onBlur?.();
  }, [editor?.commands, isFromFieldFocused, onBlur]);

  const ignoreTab: KeyboardEventHandler<HTMLDivElement> = (e) => {
    // When tab is pressed in mail editor, do not focus on URL bar
    if (e.key === 'Tab') e.preventDefault();
    // Remove focus from body when Escape is pressed
    if (e.key === 'Escape') {
      // close compose on escape
      e.stopPropagation();
      e.preventDefault();
      closeCompose();
    }
  };

  useEffect(() => {
    if (editor) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      editor.extensionStorage[Placeholder.name].placeholderContent = 'Write message';
    }
  }, [editor?.extensionStorage]);

  useEffect(() => {
    if (isFocused) editor?.commands.focus();
    else if (isFromFieldFocused) blurEditor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, isFromFieldFocused]); // Please do not include editor / editor.commands inside useEffect it will lead to infinity effects

  useEffect(() => {
    if (isAndroid) {
      // You can also attach it directly to the `contenteditable`
      document.addEventListener('beforeinput', hackFixSamsungKeyboardBug);
    }
    return () => {
      if (isAndroid) {
        document.removeEventListener('beforeinput', hackFixSamsungKeyboardBug);
      }
    };
  }, []);

  return (
    editor && (
      <>
        <MailEditorInputContainer
          $keyboardPaddingOffset={keyboardPaddingOffset}
          data-test='compose-editor'
          hasAttachments={hasAttachments}
          isFullExpanded={composeCollapseState === ComposeExpandTypes.FullExpanded}
          onClick={() => editor?.commands.focus()}
          onDrop={onDrop}
          onKeyDown={ignoreTab}
          ref={containerRef}
        >
          {editor && !showFormatBar && (
            <ToolBar
              editor={editor}
              editorBoundingRect={editorBoundingRect}
              preventFloating={editor.isActive('link')}
            />
          )}
          {editor && <EditorContent editor={editor} />}
          {linkCreateOpen && (
            <LinkCreatePopup editor={editor} editorContainerRef={showFormatBar ? toolbarRef : containerRef} />
          )}
          {colorPickerOpen && (
            <ColorPopup editor={editor} editorContainerRef={showFormatBar ? toolbarRef : containerRef} />
          )}
          {editor.isActive('link') && <LinkPopup editor={editor} editorContainerRef={containerRef} />}
        </MailEditorInputContainer>
        <FormatOptionsToolbar editor={editor} ref={toolbarRef} />
        {isMobile && editor.isFocused && <MobileComposeToolbar editor={editor} optionButtons={mobileToolbarButtons} />}
      </>
    )
  );
};

export default MailEditor;
