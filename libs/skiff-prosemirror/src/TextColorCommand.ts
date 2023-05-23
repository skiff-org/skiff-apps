import nullthrows from 'nullthrows';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { ComponentProps } from 'react';

import addToStoredMarks from './addToStoredMarks';
import applyMark from './applyMark';
import findNodesWithSameMark from './findNodesWithSameMark';
import isTextStyleMarkCommandEnabled from './isTextStyleMarkCommandEnabled';
import { MARK_TEXT_COLOR } from './MarkNames';
import { MetaTypes, slashMenuKey } from './slashMenu/InterfacesAndEnums';
import { TEXT_COLOR_ATTRIBUTE } from './TextColorMarkSpec';
import { isTextColorActive } from './TextColorUtils';
import ColorEditor from './ui/ColorEditor';
import createPopUp from './ui/createPopUp';
import { PopUpHandle } from './ui/PopUp';
import UICommand from './ui/UICommand';

class TextColorCommand extends UICommand {
  _popUp: PopUpHandle<ComponentProps<typeof ColorEditor>> | null = null;

  isActive = (state: EditorState, color: string) =>
    isTextColorActive(state, color, MARK_TEXT_COLOR, TEXT_COLOR_ATTRIBUTE);

  isEnabled = (state: EditorState): boolean => isTextStyleMarkCommandEnabled(state, MARK_TEXT_COLOR);

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
    const markType = schema.marks[MARK_TEXT_COLOR];
    const anchor = event ? event.currentTarget : null;
    const { from, to } = selection;
    const result = findNodesWithSameMark(doc, from, to, markType);
    const hex: string | null = result ? result.mark.attrs.color : null;
    return new Promise((resolve) => {
      this._popUp = createPopUp(
        ColorEditor,
        {
          hex,
          highlight: false
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
    color?: string | null
  ): boolean => {
    if (dispatch && color !== undefined) {
      const { schema } = state;
      let { tr } = state;
      const markType = schema.marks[MARK_TEXT_COLOR];
      const attrs = color
        ? {
            color
          }
        : undefined;

      tr = applyMark(tr.setSelection(state.selection), schema, markType, attrs);
      const { storedMarks } = state;
      // If there are storedMarks set, we want to preserve them, happens when user sets font type/color/highlightColor one after the other without typing
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

export default TextColorCommand;
