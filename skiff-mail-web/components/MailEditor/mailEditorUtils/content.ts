import { Content, Editor } from '@tiptap/react';

import { isSelectionNotEmpty } from './selection';

/**
 * clear editor content
 */
export const clearEditor = (editor: Editor) => {
  editor?.commands.clearContent();
};

/**
 * Avoid using this, this will override the entire current editor state.
 */
export const setEditor = (editor: Editor, content: Content, jumpToStart = false) => {
  if (editor?.commands && !editor.isDestroyed) {
    editor?.commands.setContent(content);
    if (jumpToStart) editor.commands.setTextSelection(0);
  }
};

/**
 * check if the toggle link command should be enabled
 */
export const isLinkEnabled = (editor: Editor) => editor && isSelectionNotEmpty(editor) && !editor?.isActive('link');

/**
 * toggle a link around the current selection
 */
export const toggleLink = (editor: Editor) => {
  editor?.commands.toggleLinkCreatePopup();
};
