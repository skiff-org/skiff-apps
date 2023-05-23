import { EditorState, Transaction } from 'prosemirror-state';
import { findParentNodeOfType } from 'prosemirror-utils';
import { EditorView } from 'prosemirror-view';

import { HEADING } from './NodeNames';
import { MetaTypes, slashMenuKey } from './slashMenu/InterfacesAndEnums';
import toggleHeading from './toggleHeading';
import UICommand from './ui/UICommand';

class HeadingCommand extends UICommand {
  _level: number | null | undefined;

  constructor(level?: number | null) {
    super();
    this._level = level;
  }

  isActive = (state: EditorState): boolean => {
    const result = this._findHeading(state);
    return result?.node?.attrs?.level === this._level;
  };

  execute = (state: EditorState, dispatch?: (tr: Transaction) => void, _view?: EditorView | null): boolean => {
    const { schema, selection } = state;
    const tr = toggleHeading(state.tr.setSelection(selection), schema, this._level);
    const slashMenuOpen = slashMenuKey.getState(state)?.open;
    // if the slashMenu is open then the command came from there so we close it
    if (slashMenuOpen) {
      tr.setMeta(slashMenuKey, { type: MetaTypes.close });
    }
    if (tr.docChanged) {
      dispatch?.(tr);
      return true;
    }
    return false;
  };

  _findHeading(state: EditorState): Record<string, any> | null | undefined {
    const heading = state.schema.nodes[HEADING];
    const fn = heading ? findParentNodeOfType(heading) : undefined;
    return fn?.(state.selection);
  }
}

export default HeadingCommand;
