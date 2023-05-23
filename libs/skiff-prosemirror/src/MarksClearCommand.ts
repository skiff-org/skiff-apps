import { CellSelection } from '@skiff-org/prosemirror-tables';
import { AllSelection, EditorState, TextSelection, Transaction } from 'prosemirror-state';

import clearMarks from './clearMarks';
import UICommand from './ui/UICommand';

class MarksClearCommand extends UICommand {
  isActive = (): boolean => false;

  isEnabled = (state: EditorState) => {
    const { selection } = state;
    return (
      !selection.empty &&
      (selection instanceof TextSelection || selection instanceof AllSelection || selection instanceof CellSelection)
    );
  };

  execute = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    const tr = clearMarks(state.tr.setSelection(state.selection), state.schema);

    if (dispatch && tr.docChanged) {
      dispatch(tr);
      return true;
    }

    return false;
  };
}

export default MarksClearCommand;
