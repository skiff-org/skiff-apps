import { EditorState } from 'prosemirror-state';

const ZERO_WIDTH_SPACE_CHAR = '\u200b';
export default function isEditorStateEmpty(editorState: EditorState): boolean {
  const { doc } = editorState;
  const { nodeSize } = doc;

  if (nodeSize < 2) {
    const text = doc.textContent;
    return !text || text === ' ';
  }
  if (nodeSize < 10) {
    let isEmpty = true;
    doc.nodesBetween(0, doc.nodeSize - 2, (node, ii) => {
      if (isEmpty) {
        const nodeType = node.type;

        if (nodeType.isText) {
          const text = doc.textContent;
          isEmpty = !text || text === ' ' || text === ZERO_WIDTH_SPACE_CHAR;
        } else if (nodeType.isAtom) {
          // e.g. Image, Video...etc.
          isEmpty = false;
        }
      }

      return isEmpty;
    });
    return isEmpty;
  }
  return false;
}
