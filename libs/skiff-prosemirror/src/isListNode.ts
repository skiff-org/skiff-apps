import { Node } from 'prosemirror-model';

import isBulletListNode from './isBulletListNode';
import isOrderedListNode from './isOrderedListNode';
import isTodoListNode from './isTodoList';
import isToggleList from './isToggleList';

export default function isListNode(node: Node): boolean {
  if (node instanceof Node) {
    return isBulletListNode(node) || isOrderedListNode(node) || isTodoListNode(node) || isToggleList(node);
  }

  return false;
}
