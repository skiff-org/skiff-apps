import { Plugin, PluginKey, TextSelection } from 'prosemirror-state';
import { NodeWithPos } from 'prosemirror-utils';

import { DOC_TITLE } from '../NodeNames';

export const focusEditorSelection = 'focus-editor-selection';

export const focusTitlePluginKey = new PluginKey('focus-title-plugin');

export class FocusTitlePlugin extends Plugin {
  constructor() {
    super({
      key: focusTitlePluginKey,
      appendTransaction: (transactions, _oldState, newState) => {
        if (!transactions.some((tr) => tr.getMeta(focusEditorSelection))) return;
        let titleNodePos: NodeWithPos | undefined;

        // Find the first (and only) title node
        newState.doc.descendants((node, pos) => {
          if (node.type.name === DOC_TITLE) {
            titleNodePos = { node, pos };
            return false;
          }
          return true;
        });

        if (!titleNodePos) return;
        if (titleNodePos.node.textContent) return;
        // if no text content set selection to title
        const tr = newState.tr;
        tr.setSelection(TextSelection.create(newState.doc, titleNodePos.pos + 1));
        return tr;
      }
    });
  }
}
