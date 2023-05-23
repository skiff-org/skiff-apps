import { EditorState, Selection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { SUBPAGE } from '../NodeNames';
import UICommand from '../ui/UICommand';

/**
 * Command for "jumping" cleanly over the subpage node when pressing Delete / Backspace
 */
class JumpOverSubpageCommand extends UICommand {
  _direction: 'up' | 'down';

  constructor(direction: 'up' | 'down') {
    super();
    this._direction = direction;
  }

  execute = (state: EditorState, dispatch?: (tr: Transaction) => void, _view?: EditorView | null): boolean => {
    const { tr, selection } = state;

    const jumpingUp = this._direction === 'up';
    // next valid selection in the direction
    const goingToBe = Selection.near(state.doc.resolve(selection.anchor + (jumpingUp ? -1 : 1)), jumpingUp ? -1 : 1);

    const start = jumpingUp ? goingToBe.anchor : selection.anchor;
    const end = jumpingUp ? selection.anchor : goingToBe.anchor;

    let containsSubpage = false;
    // the node between current and next selection
    state.doc.nodesBetween(start, end, (node) => {
      if (node.type.name === SUBPAGE) {
        containsSubpage = true;
        return false;
      }
      return true;
    });

    if (containsSubpage) {
      // jump and dont delete

      const currentNode = selection.$anchor.parent;
      if (currentNode.isTextblock && currentNode.content.size === 0) {
        tr.deleteRange(selection.from - 1, selection.from - 1 + currentNode.nodeSize);
        const goingToBeWithRemove = Selection.near(
          tr.doc.resolve(selection.anchor + (jumpingUp ? -1 : 1)),
          jumpingUp ? -1 : 1
        );
        tr.setSelection(goingToBeWithRemove);
      } else {
        tr.setSelection(goingToBe);
      }

      if (dispatch) dispatch(tr);

      return true;
    }

    return false;
  };
}

export default JumpOverSubpageCommand;
