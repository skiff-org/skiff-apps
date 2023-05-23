import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { StorageTypes } from 'skiff-utils';

import { deleteOldDocStates, getDocId } from './utils/storageUtils';

export const localstorageCleanerKey = new PluginKey('localstorage-cleaner');

// clean all toggles state data that was unused for 7 days
const TOGGLE_TTL = 1000 * 60 * 60 * 24 * 7;

class PluginView {
  constructor(public view: EditorView) {}

  destroy() {
    const docID = getDocId(this.view.state);
    if (!docID) return;
    deleteOldDocStates(docID, StorageTypes.TOGGLE_ITEM, TOGGLE_TTL);
  }
}

/*
 * Plugin for doing a local storage cleanup on doc open/close
 *	currently clears only the toggles state, meant to handle all localStorage cleanups.
 */

export default new Plugin({
  key: localstorageCleanerKey,
  view: (view) => new PluginView(view)
});
