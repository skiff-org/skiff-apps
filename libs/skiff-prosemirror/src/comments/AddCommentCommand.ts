import { EditorState, TextSelection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { MARK_COMMENT } from '../MarkNames';
import UICommand from '../ui/UICommand';

import { openEmptyThreadPopupKey } from './comment.types';

class AddCommentCommand extends UICommand {
  _popup = null;

  isEnabled = (state: EditorState): boolean => {
    if (!(state.selection instanceof TextSelection)) {
      // Could be a NodeSelection or CellSelection.
      return false;
    }

    const markType = state.schema.marks[MARK_COMMENT];

    if (!markType) {
      return false;
    }

    const { from, to } = state.selection;
    return to - from > 1;
  };

  execute = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    _view?: EditorView | null,
    event?: React.SyntheticEvent | null
  ): boolean => {
    if (dispatch) {
      const { tr } = state;
      tr.setMeta(openEmptyThreadPopupKey, true);
      dispatch(tr);
    }
    event?.stopPropagation();
    return false;
  };
}

export default AddCommentCommand;
