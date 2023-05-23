import { Node } from 'prosemirror-model';

import { TODO_LIST } from './NodeNames';

export default function isTodoListNode(node: Node): boolean {
  return node.type.name === TODO_LIST;
}
