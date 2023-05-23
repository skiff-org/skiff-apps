import { Node as PMNode, Schema } from 'prosemirror-model';

import { clampIndent } from './clampIndent';

interface NewListNode {
  start: number;
  indent: number;
  children: ListChild[];
}
interface ListChild {
  pos: number;
  node: PMNode;
  indent: number;
}

export function indentListContent(
  listNodePos: number,
  listNode: PMNode,
  indentFrom: number,
  indentTo: number,
  delta: number,
  schema: Schema,
  doc: PMNode
) {
  const { start, indent } = listNode.attrs as { start: number; indent: number };
  const newListNode: NewListNode = {
    start: start || 1,
    indent: clampIndent(indent || 0),
    children: []
  };
  // List of currently wrapping list node end positions to know the current indendation
  // (not relying on indent attribute since this might be a copy-pasted slice with the values all wrong)
  const wrappingLists: number[] = [];
  doc.nodesBetween(listNodePos, listNodePos + listNode.nodeSize, (node, pos, parentNode) => {
    while (pos > wrappingLists[wrappingLists.length - 1]) {
      wrappingLists.pop();
    }
    if (node.type === listNode.type) {
      wrappingLists.push(pos + node.nodeSize);
    }
    // New row / list_item found
    if (pos !== listNodePos && (node.type === schema.nodes.list_item || node.type === schema.nodes.list_task_item)) {
      const wasIndented = pos + node.nodeSize >= indentFrom && pos <= indentTo;
      const curIndent: number = (parentNode?.attrs.indent as number) || newListNode.indent;
      newListNode.children.push({
        pos,
        node,
        indent: clampIndent(wasIndented ? curIndent + delta : curIndent)
      });
    }
  });
  return newListNode;
}

export function createListNode(newListNode: NewListNode, listNode: PMNode) {
  const newNodes: PMNode[] = [];
  let prevChild: ListChild | undefined,
    currentList: { node: PMNode | undefined; indent: number; content: PMNode[] } | undefined;
  newListNode.children.forEach((child) => {
    const { node } = child;
    // Start a new list incase no current list node or the indentation has changed
    if (!prevChild || child.indent !== prevChild.indent) {
      if (currentList) {
        const attrs = { ...(currentList.node || listNode).attrs, indent: currentList.indent };
        Array.prototype.push.apply(newNodes, [
          listNode.type.createChecked(attrs, currentList.content, (listNode || currentList.node).marks)
        ]);
      }
      currentList = {
        indent: child.indent,
        node: !prevChild ? undefined : node,
        content: [node]
      };
    } else if (child.indent === prevChild.indent && currentList) {
      // Same indentation -> just a regular list_item inside the current list
      currentList.content.push(node);
    }
    prevChild = child;
  });
  if (currentList) {
    // Push the current list node to the generated new nodes to replace the original
    newNodes.push(
      listNode.type.createChecked(
        { ...listNode.attrs, indent: currentList.indent },
        currentList.content,
        listNode.marks
      )
    );
  }
  return newNodes;
}
