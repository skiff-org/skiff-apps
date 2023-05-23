import nullthrows from 'nullthrows';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { ComponentProps } from 'react';

import addToStoredMarks from './addToStoredMarks';
import applyMark from './applyMark';
import findNodesWithSameMark from './findNodesWithSameMark';
import isTextStyleMarkCommandEnabled from './isTextStyleMarkCommandEnabled';
import { MARK_TEXT_HIGHLIGHT } from './MarkNames';
import { MetaTypes, slashMenuKey } from './slashMenu/InterfacesAndEnums';
import { isTextColorActive } from './TextColorUtils';
import { TEXT_HIGHLIGHT_COLOR_ATTRIBUTE } from './TextHighlightMarkSpec';
import ColorEditor from './ui/ColorEditor';
import createPopUp from './ui/createPopUp';
import { PopUpHandle } from './ui/PopUp';
import UICommand from './ui/UICommand';

class TextHighlightCommand extends UICommand {
  _popUp: PopUpHandle<ComponentProps<typeof ColorEditor>> | null = null;

  isActive = (state: EditorState, color: string) =>
    isTextColorActive(state, color, MARK_TEXT_HIGHLIGHT, TEXT_HIGHLIGHT_COLOR_ATTRIBUTE);

  isEnabled = (state: EditorState): boolean => isTextStyleMarkCommandEnabled(state, MARK_TEXT_HIGHLIGHT);

  waitForUserInput = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView | null,
    event?: React.SyntheticEvent | null
  ): Promise<any> => {
    if (this._popUp) {
      return Promise.resolve(undefined);
    }

    const target = nullthrows(event).currentTarget;

    if (!(target instanceof HTMLElement)) {
      return Promise.resolve(undefined);
    }

    const { doc, selection, schema } = state;
    const markType = schema.marks[MARK_TEXT_HIGHLIGHT];
    const { from, to } = selection;
    const result = findNodesWithSameMark(doc, from, to, markType);
    const hex = result ? result.mark.attrs.highlightColor : null;
    const anchor = event ? event.currentTarget : null;
    return new Promise((resolve) => {
      this._popUp = createPopUp(
        ColorEditor,
        {
          hex,
          highlight: true
        },
        {
          anchor,
          onClose: (val) => {
            if (this._popUp) {
              this._popUp = null;
              resolve(val);
            }
          }
        }
      );
    });
  };

  executeWithUserInput = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView | null,
    color?: string | null,
    transaction?: Transaction
  ): boolean => {
    if (dispatch && color !== undefined) {
      const { schema } = state;
      // if a transaction is provided we use that and append steps
      let tr = transaction || state.tr;
      const markType = schema.marks[MARK_TEXT_HIGHLIGHT];
      const attrs = color
        ? {
            highlightColor: color
          }
        : undefined;

      tr = applyMark(tr.setSelection(state.selection), schema, markType, attrs);
      const { storedMarks } = state;

      // If there are storedMarks set, we want to preserve them, happens when user sets font type/color/highlightColor one after the other without typin
      if (storedMarks) {
        addToStoredMarks(storedMarks, markType, tr, attrs);
      }

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
    }

    return false;
  };
}

export default TextHighlightCommand;
