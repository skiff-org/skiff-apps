import { Extension } from '@tiptap/core';
import { Node } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

export type PasteHandler = (view: EditorView, event: ClipboardEvent) => boolean;
export type ClickOnHandler = (view: EditorView, pos: number, node: Node, nodePos: number, event: MouseEvent) => boolean;

/**
 * Plugin for passing external paste handlers
 */
export const PastePlugin = (pasteHandlers: PasteHandler[], clickOnHandlers: ClickOnHandler[]) =>
  Extension.create({
    name: 'PastePlugin',
    addProseMirrorPlugins() {
      return [
        new Plugin({
          props: {
            handleClickOn(view, pos, node, nodePos, event) {
              for (const handler of clickOnHandlers) {
                if (handler(view, pos, node, nodePos, event)) return true;
              }
              return false;
            },
            handlePaste(view, event) {
              for (const handler of pasteHandlers) {
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
