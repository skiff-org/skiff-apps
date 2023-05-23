import { CellSelection } from '@skiff-org/prosemirror-tables';
import { Schema } from 'prosemirror-model';
import { AllSelection, EditorState, TextSelection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import React from 'react';

import addToStoredMarks from './addToStoredMarks';
import applyMark from './applyMark';
import { MARK_FONT_TYPE } from './MarkNames';
import { MetaTypes, slashMenuKey } from './slashMenu/InterfacesAndEnums';
import UICommand from './ui/UICommand';

function setFontType(tr: Transaction, schema: Schema, name: string, state?: EditorState): Transaction {
  const markType = schema.marks[MARK_FONT_TYPE];

  if (!markType) {
    return tr;
  }

  const { selection } = tr;

  if (
    !(selection instanceof TextSelection || selection instanceof AllSelection || selection instanceof CellSelection)
  ) {
    return tr;
  }

  const attrs = name
    ? {
        name
      }
    : undefined;
  tr = applyMark(tr, schema, markType, attrs);

  // If there are storedMarks set, we want to preserve them, happens when user sets font type/color/highlightColor one after the other without typing
  if (state?.storedMarks) {
    addToStoredMarks(state?.storedMarks, markType, tr, attrs);
  }
  return tr;
}

class FontTypeCommand extends UICommand {
  _label: JSX.Element | null = null;

  _name = '';

  _title = '';

  _popUp = null;

  constructor(name: string, title: string) {
    super();
    this._name = name;
    this._label = name ? (
      <span
        data-test={`font-button-${name}`}
        style={{
          fontFamily: name
        }}
      >
        {title}
      </span>
    ) : null;
  }

  renderLabel = (_state: EditorState): any => this._label;

  isEnabled = (state: EditorState): boolean => {
    const { schema, selection, tr } = state;

    if (
      !(selection instanceof TextSelection || selection instanceof AllSelection || selection instanceof CellSelection)
    ) {
      return false;
    }

    const markType = schema.marks[MARK_FONT_TYPE];

    if (!markType) {
      return false;
    }

    const { from, to } = selection;

    if (to === from + 1) {
      const node = tr.doc.nodeAt(from);

      if (node?.isAtom && !node.isText && node.isLeaf) {
        // An atomic node (e.g. Image) is selected.
        return false;
      }
    }

    return true;
  };

  execute = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView | null): boolean => {
    const { schema, selection } = state;
    const tr = setFontType(state.tr.setSelection(selection), schema, this._name, state);
    const slashMenuOpen = slashMenuKey.getState(state)?.open;
    // if the slashMenu is open then the command came from there so we close it
    if (slashMenuOpen) {
      tr.setMeta(slashMenuKey, { type: MetaTypes.close });
    }
    if (tr.docChanged || tr.storedMarksSet) {
      // If selection is empty, the color is added to `storedMarks`, which
      // works like `toggleMark`
      // (see https://prosemirror.net/docs/ref/#commands.toggleMark).
      dispatch?.(tr);
      return true;
    }

    return false;
  };
}

export default FontTypeCommand;
