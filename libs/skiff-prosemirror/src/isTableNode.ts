import { Node } from 'prosemirror-model';

import { TABLE, TABLE_CELL, TABLE_HEADER, TABLE_ROW } from './NodeNames';

export default function isTableNode(node: Node): boolean {
  const name = node instanceof Node ? node.type.name : null;
  return name === TABLE || name === TABLE_ROW || name === TABLE_HEADER || name === TABLE_CELL;
}
