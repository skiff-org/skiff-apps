import { Node } from 'prosemirror-model';

export default function nodeAt(doc: Node, pos: number): Node | null | undefined {
  if (pos < 0 || pos > doc.content.size) {
    // Exit here or error will be thrown:
    // e.g. RangeError: Position outside of fragment.
    return null;
  }

  return doc.nodeAt(pos);
}
