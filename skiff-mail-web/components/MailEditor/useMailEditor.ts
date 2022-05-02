import { Editor, useEditor } from '@tiptap/react';
import applyProsemirrorDevtools from 'prosemirror-dev-tools';
import { useEffect, useState } from 'react';

import { buildEditorExtensions, EditorExtensionsOptions } from './Extensions';
import { isSelectionNotEmpty } from './mailEditorUtils';

interface MailEditorProps {
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
   * defaults to empty
   */
  initialHtmlContent?: string;
  /**
   * all custom extensions options
   */
  extensionsOptions?: EditorExtensionsOptions;
}

/**
 * This is the main editor hook,
 * it returned a editor and "actions" on the editor
 *
 * this should be where we write the editor logic, not in the Compose
 */
const useMailEditor = (props: MailEditorProps) => {
  const { onChange, onCreate, initialHtmlContent, extensionsOptions } = props;
  const [isEditorDirty, setIsEditorDirty] = useState<boolean>(false);

  useEffect(() => {
    // Set dirty to false if the initial content change - case like switching drafts
    setIsEditorDirty(false);
  }, [initialHtmlContent]);

  /**
   * Main tiptap editor object, should be used to read only outside the MailEditor
   */

  const editor = useEditor({
    editable: true,
    extensions: buildEditorExtensions(extensionsOptions),
    onTransaction: ({ transaction }) => {
      if (transaction.docChanged && !transaction.getMeta('preventUpdate')) {
        // Set dirty only when docChanged and ignore cases where it wasn't a user's trans
        setIsEditorDirty(true);
      }
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onChange?.(updatedEditor as Editor);
    },
    content: initialHtmlContent,
    onCreate({ editor: createdEditor }) {
      if (process.env.PM_DEVTOOLS) applyProsemirrorDevtools(createdEditor.view);
      onCreate?.(createdEditor as Editor);
      onChange?.(createdEditor as Editor);
    }
  });

  /**
   * clear editor content
   */
  const clearEditor = () => {
    editor?.commands.clearContent();
  };

  /**
   * Avoid using this, this will override the entire current editor state.
   */
  const setEditor = (content) => {
    editor?.commands.setContent(content);
  };

  /**
   * check if the toggle link command should be enabled
   */
  const isLinkEnabled = () => editor && isSelectionNotEmpty(editor) && !editor?.isActive('link');

  /**
   * toggle a link around the current selection
   */
  const toggleLink = () => {
    editor?.commands.toggleLinkCreatePopup();
  };

  return { editor, clearEditor, isLinkEnabled, toggleLink, setEditor, isEditorDirty };
};

export default useMailEditor;
