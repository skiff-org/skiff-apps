import { Mark, MarkType, Node } from 'prosemirror-model';

export default function findActiveMarks(
  doc: Node,
  from: number,
  to: number,
  markType: MarkType
): (Mark | undefined)[] | null {
  let ii = from;

  if (doc.nodeSize <= 2) {
    return null;
  }

  const finder = (mark: Mark) => mark.type === markType;

  from = Math.max(2, from);
  to = Math.min(to, doc.nodeSize - 2);
  const marks: Array<Mark | undefined> = [];

  while (ii <= to) {
    const node = doc.nodeAt(ii);

    if (!node || !node.marks) {
      ii += 1;
      continue;
    }

    const mark = node.marks.find(finder);

    if (
      (mark && !marks.find((m: Mark | undefined) => m && m.eq(mark))) || // take one instance of 'null' mark to indicate active default styling
      (!mark && !marks.includes(mark))
    ) {
      marks.push(mark);
    }

    ii += 1;
  }

  return marks.filter((curMark) => !!curMark);
}
