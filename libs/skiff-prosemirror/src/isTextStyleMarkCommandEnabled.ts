import { CellSelection } from '@skiff-org/prosemirror-tables';
import { AllSelection, EditorState, TextSelection } from 'prosemirror-state'; // Whether the command for apply specific text style mark is enabled.

export default function isTextStyleMarkCommandEnabled(state: EditorState, markName: string): boolean {
  const { selection, schema, tr } = state;
  const markType = schema.marks[markName];

  if (!markType) {
    return false;
  }

  if (
    !(selection instanceof TextSelection || selection instanceof AllSelection || selection instanceof CellSelection)
  ) {
    // Could be a NodeSelection or CellSelection.
    return false;
  }

  const { from, to } = state.selection;

  if (to === from + 1) {
    const node = tr.doc.nodeAt(from);

    if (!node) {
      console.log('COULD NOT FIND NODE - fix (isTextStyleMarkCommand)');
      return false;
    }

    if (node.isAtom && !node.isText && node.isLeaf) {
      // An atomic node (e.g. Image) is selected.
      return false;
    }
  }

  return true;
}
