import { NodeType } from 'prosemirror-model'; // Whether the selection is a node for the node type provided.
import { NodeSelection, Selection } from 'prosemirror-state';

export default function isNodeSelectionForNodeType(selection: Selection, nodeType: NodeType): boolean {
  if (selection instanceof NodeSelection) {
    return selection.node.type === nodeType;
  }

  return false;
}
