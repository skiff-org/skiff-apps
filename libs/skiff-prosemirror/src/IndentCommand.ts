import { EditorState, Transaction } from 'prosemirror-state';
import { findParentNodeOfType } from 'prosemirror-utils';
import { EditorView } from 'prosemirror-view';

import { indentSelection } from './commands/indentSelection';
import { TOGGLE_ITEM_TITLE } from './NodeNames';
import UICommand from './ui/UICommand';

class IndentCommand extends UICommand {
  _delta: number;

  constructor(delta: number) {
    super();
    this._delta = delta;
  }

  isActive = (state: EditorState): boolean => false;

  execute = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView | null): boolean => {
    const { selection, schema } = state;
    const parentToggleTitle = findParentNodeOfType(schema.nodes[TOGGLE_ITEM_TITLE])(selection);
    if (parentToggleTitle) return false;
    return indentSelection(this._delta)(state, dispatch, view);
  };
}

export default IndentCommand;
