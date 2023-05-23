import { EditorView } from 'prosemirror-view';

import { BACKSPACE, DELETE, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW, UP_ARROW } from './KeyCodes';

const AtomicNodeKeyCodes = new Set([BACKSPACE, DELETE, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW, UP_ARROW]);
export default function handleEditorKeyDown(view: EditorView, event: KeyboardEvent): boolean {
  const { selection, tr } = view.state;
  const { from, to } = selection;

  if (from === to - 1) {
    const node = tr.doc.nodeAt(from);

    if (node?.isAtom && !node.isText && node.isLeaf) {
      // An atomic node (e.g. Image) is selected.
      // Only whitelisted keyCode should be allowed, which prevents user
      // from typing letter after the atomic node selected.
      return !AtomicNodeKeyCodes.has(event.keyCode);
    }
  }

  return false;
}
