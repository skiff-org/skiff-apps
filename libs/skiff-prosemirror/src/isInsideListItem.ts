import { Node } from 'prosemirror-model';

import { LIST_ITEM } from './NodeNames';

export default function isInsideListItem(doc: Node, pos: number): boolean {
  if (doc.nodeSize < 2 || pos < 2) {
    return false;
  }

  const prevNode = doc.nodeAt(pos - 1);
  return prevNode?.type.name === LIST_ITEM;
}
