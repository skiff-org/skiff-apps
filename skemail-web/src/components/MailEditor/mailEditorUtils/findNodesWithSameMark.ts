import { Mark, MarkType, Node } from 'prosemirror-model';

type Result = {
  mark: Mark;
  from: {
    node: Node;
    pos: number;
  };
  to: {
    node: Node;
    pos: number;
  };
}; // If nodes within the same range have the same mark, returns
// the first node.

export default function findNodesWithSameMark(
  doc: Node,
  from: number,
  to: number,
  markType: MarkType | undefined
): Result | null {
  let ii = from;

  const finder = (mark: Mark) => mark.type === markType;

  let firstMark: Mark | null = null;
  let fromNode: null | Node | undefined = null;
  let toNode: null | Node | undefined = null;

  while (ii <= to) {
    const node = doc.nodeAt(ii);

    if (!node || !node.marks) {
      return null;
    }

    const mark = node.marks.find(finder);

    if (!mark) {
      return null;
    }

    if (firstMark && mark !== firstMark) {
      return null;
    }

    fromNode = fromNode || node;
    firstMark = firstMark || mark;
    toNode = node;
    ii += 1;
  }

  let fromPos = from;
  let toPos = to;
  let jj = 0;
  ii = from - 1;

  while (ii > jj) {
    const node = doc.nodeAt(ii);
    const mark = node?.marks.find(finder);

    if (!mark || mark !== firstMark) {
      break;
    }

    fromPos = ii;
    fromNode = node;
    ii -= 1;
  }

  ii = to + 1;
  jj = doc.nodeSize - 2;

  while (ii < jj) {
    const node = doc.nodeAt(ii);
    const mark = node?.marks.find(finder);

    if (!mark || mark !== firstMark) {
      break;
    }

    toPos = ii;
    toNode = node;
    ii += 1;
  }

  if (!firstMark || !fromNode || !toNode) {
    return null;
  }

  return {
    mark: firstMark,
    from: {
      node: fromNode,
      pos: fromPos
    },
    to: {
      node: toNode,
      pos: toPos
    }
  };
}
