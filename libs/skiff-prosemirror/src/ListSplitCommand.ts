import { EditorState, Transaction } from 'prosemirror-state';

import splitListItem from './splitListItem';
import UICommand from './ui/UICommand';

class ListSplitCommand extends UICommand {
  execute = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    const { selection, schema } = state;
    const tr = splitListItem(state.tr.setSelection(selection), schema);

    if (tr.docChanged) {
      dispatch?.(tr);
      return true;
    }
    return false;
  };
}

export default ListSplitCommand;
