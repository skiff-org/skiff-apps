import { Fragment, Schema } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { HORIZONTAL_RULE } from './NodeNames';
import { MetaTypes, slashMenuKey } from './slashMenu/InterfacesAndEnums';
import UICommand from './ui/UICommand';

function insertHorizontalRule(tr: Transaction, schema: Schema): Transaction {
  const { selection } = tr;

  if (!selection) {
    return tr;
  }

  const { from, to } = selection;

  if (from !== to) {
    return tr;
  }

  const horizontalRule = schema.nodes[HORIZONTAL_RULE];

  if (!horizontalRule) {
    return tr;
  }

  const node = horizontalRule.create({}, undefined, undefined);
  const frag = Fragment.from(node);
  tr = tr.insert(from, frag);
  return tr;
}

class HorizontalRuleCommand extends UICommand {
  execute = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView | null,
    event?: React.SyntheticEvent | null
  ): boolean => {
    const { selection, schema } = state;
    const { tr } = state;
    const slashMenuOpen = slashMenuKey.getState(state)?.open;
    // if the slashMenu is open then the command came from there so we close it
    if (slashMenuOpen) {
      tr.setMeta(slashMenuKey, { type: MetaTypes.close });
    }
    const newTr = insertHorizontalRule(tr.setSelection(selection), schema);

    if (newTr.docChanged) {
      dispatch?.(newTr);
      return true;
    }
    return false;
  };
}

export default HorizontalRuleCommand;
