import { Extension } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

export type PasteHandler = (view: EditorView, event: ClipboardEvent) => boolean;

/**
 * Plugin for passing external paste handlers
 */
export const PastePlugin = (handlers: PasteHandler[]) =>
  Extension.create({
    name: 'PastePlugin',
    addProseMirrorPlugins() {
      return [
        new Plugin({
          props: {
            handlePaste(view, event) {
              for (const handler of handlers) {
                if (handler(view, event)) return true;
              }
              return false;
            }
          }
        })
      ];
    }
  });

export default PastePlugin;
