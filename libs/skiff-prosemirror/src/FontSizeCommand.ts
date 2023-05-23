import { Schema } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import applyMark from './applyMark';
import isTextStyleMarkCommandEnabled from './isTextStyleMarkCommandEnabled';
import { MARK_FONT_SIZE } from './MarkNames';
import UICommand from './ui/UICommand';

function setFontSize(tr: Transaction, schema: Schema, px: number): Transaction {
  const markType = schema.marks[MARK_FONT_SIZE];

  if (!markType) {
    return tr;
  }

  const attrs = px
    ? {
        px
      }
    : null;
  tr = applyMark(tr, schema, markType, attrs);
  return tr;
}

class FontSizeCommand extends UICommand {
  _popUp = null;

  _px = 0;

  constructor(px: number) {
    super();
    this._px = px;
  }

  isEnabled = (state: EditorState): boolean => isTextStyleMarkCommandEnabled(state, MARK_FONT_SIZE);

  execute = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView | null): boolean => {
    const { schema, selection } = state;
    const tr = setFontSize(state.tr.setSelection(selection), schema, this._px);

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

export default FontSizeCommand;
