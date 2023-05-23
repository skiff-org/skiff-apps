import { EditorView } from 'prosemirror-view';

const coordsAtPosWithRangeCheck = (view: EditorView, pos: number) => {
  if (pos <= 0 || pos > view.state.doc.content.size) {
    // Exit here or error will be thrown:
    // e.g. RangeError: Position outside of fragment.
    return undefined;
  }
  // in some occasions it can throw an error with "invalid position 0" even though the position fed to it is not 0
  try {
    return view.coordsAtPos(pos);
  } catch (error) {
    return undefined;
  }
};

export default coordsAtPosWithRangeCheck;
