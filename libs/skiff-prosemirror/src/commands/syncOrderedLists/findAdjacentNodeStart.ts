import { Node as PMNode, NodeType } from 'prosemirror-model';

export function findAdjacentNodeStart(pos: number, type: NodeType, doc: PMNode, upwards = true): number {
  const { nodeAfter, nodeBefore } = doc.resolve(pos);
  if (upwards && nodeBefore?.type === type) {
    return findAdjacentNodeStart(doc.resolve(pos - nodeBefore.nodeSize).before(1), type, doc, upwards);
  } else if (!upwards && nodeAfter?.type === type) {
    return findAdjacentNodeStart(doc.resolve(pos + nodeAfter.nodeSize).after(1), type, doc, upwards);
  }
  return pos;
}
