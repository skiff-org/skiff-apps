import { Node } from 'prosemirror-model';

import { TOGGLE_LIST } from './NodeNames';

export default function isTodoListNode(node: Node): boolean {
  return node.type.name === TOGGLE_LIST;
}
