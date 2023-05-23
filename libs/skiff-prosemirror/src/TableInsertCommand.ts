import { isInTable } from '@skiff-org/prosemirror-tables';
import { EditorState, TextSelection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import insertTable from './insertTable';
import { MetaTypes, slashMenuKey } from './slashMenu/InterfacesAndEnums';
import UICommand from './ui/UICommand';

const DEFAULT_TABLE_WIDTH = 2;
const DEFAULT_TABLE_HEIGHT = 3;

export type TableGridSizeEditorValue = {
  cols: number;
  rows: number;
};

class TableInsertCommand extends UICommand {
  _popUp = null;

  shouldRespondToUIEvent = (e: React.SyntheticEvent | MouseEvent): boolean => e.type === UICommand.EventType.CLICK;

  isEnabled = (state: EditorState): boolean => {
    const tr = state;
    const { selection } = tr;
    if (isInTable(state)) return false;

    if (selection instanceof TextSelection) {
      return selection.from === selection.to;
    }

    return false;
  };

  waitForUserInput = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView | null,
    event?: React.SyntheticEvent | null
  ): Promise<any> =>
    Promise.resolve({
      rows: DEFAULT_TABLE_HEIGHT,
      cols: DEFAULT_TABLE_WIDTH
    });

  executeWithUserInput = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView | null,
    inputs?: TableGridSizeEditorValue | null
  ): boolean => {
    if (dispatch) {
      const { selection, schema } = state;
      let { tr } = state;
      const slashMenuOpen = slashMenuKey.getState(state)?.open;
      // if the slashMenu is open then the command came from there so we close it
      if (slashMenuOpen) {
        tr.setMeta(slashMenuKey, { type: MetaTypes.close });
      }
      if (inputs) {
        const { rows, cols } = inputs;
        tr = tr.setSelection(selection);
        tr = insertTable(tr, schema, rows, cols);
      }

      dispatch(tr);
    }

    return false;
  };
}

export default TableInsertCommand;
