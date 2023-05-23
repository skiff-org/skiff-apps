import { EditorState, Transaction } from 'prosemirror-state';
import { findParentNodeOfType } from 'prosemirror-utils';
import { EditorView } from 'prosemirror-view';

import { CODE_BLOCK } from './NodeNames';
import { MetaTypes, slashMenuKey } from './slashMenu/InterfacesAndEnums';
import toggleCodeBlock from './toggleCodeBlock';
import UICommand from './ui/UICommand';

class CodeBlockCommand extends UICommand {
  isActive = (state: EditorState): boolean => {
    const result = this._findCodeBlock(state);

    return !!result?.node;
  };

  execute = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView | null): boolean => {
    const { selection, schema } = state;
    let { tr } = state;
    const slashMenuOpen = slashMenuKey.getState(state)?.open;
    // if the slashMenu is open then the command came from there so we close it
    if (slashMenuOpen) {
      tr.setMeta(slashMenuKey, { type: MetaTypes.close });
    }
    tr = tr.setSelection(selection);
    tr = toggleCodeBlock(tr, schema);

    if (tr.docChanged) {
      dispatch?.(tr);
      return true;
    }
    return false;
  };

  _findCodeBlock(state: EditorState): Record<string, any> | null | undefined {
    const codeBlock = state.schema.nodes[CODE_BLOCK];
    const findCodeBlock = codeBlock ? findParentNodeOfType(codeBlock) : undefined;
    return findCodeBlock?.(state.selection);
  }
}

export default CodeBlockCommand;
