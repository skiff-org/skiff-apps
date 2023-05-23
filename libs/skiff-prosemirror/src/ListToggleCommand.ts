import { isInTable } from '@skiff-org/prosemirror-tables';
import { EditorState, TextSelection, Transaction } from 'prosemirror-state';
import { findParentNodeClosestToPos, findParentNodeOfType } from 'prosemirror-utils';
import { EditorView } from 'prosemirror-view';

import { BULLET_LIST, ORDERED_LIST, TABLE_CELL, TODO_LIST, TOGGLE_LIST } from './NodeNames';
import { MetaTypes, slashMenuKey } from './slashMenu/InterfacesAndEnums';
import toggleList from './toggleList';
import UICommand from './ui/UICommand';

export type ListType = typeof BULLET_LIST | typeof ORDERED_LIST | typeof TODO_LIST | typeof TOGGLE_LIST;

class ListToggleCommand extends UICommand {
  _type: ListType;

  constructor(type: ListType) {
    super();
    this._type = type;
  }

  isActive = (state: EditorState): boolean => !!this._findList(state, this._type);

  execute = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView | null): boolean => {
    const { selection, schema } = state;
    const nodeType = schema.nodes[this._type];
    let { tr } = state;
    const parentStart = findParentNodeClosestToPos(selection.$from, () => true)?.start;
    const slashMenuOpen = slashMenuKey.getState(state)?.open;

    // if the slashMenu is open then the command came from there so we close it
    // we also insert a zero width space before we toggle the list in case the command is from a table cell which has an empty paragraph
    if (slashMenuOpen) {
      tr.setMeta(slashMenuKey, { type: MetaTypes.close });
    }
    if (slashMenuOpen && findParentNodeOfType(schema.nodes[TABLE_CELL])(selection)) {
      tr.insertText('​');
    }

    if (!nodeType) {
      return false;
    }
    let adjustedSelection;
    if (parentStart) {
      adjustedSelection = TextSelection.create(tr.doc, parentStart + 1);
    }
    tr = toggleList(
      // Setting the selection to the beginning of the text node for proper list insert, in some cases like in table cells
      // the selection.from can be set on the parent nodes start and the toggle list will fail, in that case we adjust the selection
      selection.from === parentStart && adjustedSelection && isInTable(state)
        ? tr.setSelection(adjustedSelection)
        : tr.setSelection(selection),
      schema,
      nodeType
    );
    // in we inserted a zero width car just so we can toggle the list, we remove this character
    if (slashMenuOpen && findParentNodeOfType(schema.nodes[TABLE_CELL])(selection)) {
      // toggle list adds an extra node for which we need to compensate in the selection
      if (nodeType === schema.nodes[TOGGLE_LIST]) {
        tr.delete(selection.from + 3, selection.from + 4);
        tr.setSelection(TextSelection.create(tr.doc, selection.from + 3));
      }
    }
    if (tr.docChanged) {
      dispatch?.(tr);
      return true;
    }
    return false;
  };

  _findList(state: EditorState, type: string): Record<string, any> | null | undefined {
    const { nodes } = state.schema;
    const list = nodes[type];
    const findList = list ? findParentNodeOfType(list) : undefined;
    return findList?.(state.selection);
  }
}

export default ListToggleCommand;
