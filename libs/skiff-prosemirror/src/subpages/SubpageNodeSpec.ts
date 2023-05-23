import { Node, NodeSpec } from 'prosemirror-model';

import uuid from '../ui/uuid';

const SUBPAGE_NODE_CLASS = 'subpage-node';

export enum SubpageNodeType {
  Large = 'large',
  Small = 'small'
}
export interface SubpageNodeAttrs {
  nodeID: string;
  docID: string | null;
  type: SubpageNodeType;
}

const SubpageNodeSpec: NodeSpec = {
  attrs: {
    nodeID: {
      default: null
    },
    docID: {
      default: null
    },
    type: {
      default: SubpageNodeType.Large
    }
  },
  group: 'block',
  atom: false,
  selectable: false,
  draggable: true,
  parseDOM: [
    {
      tag: `div.${SUBPAGE_NODE_CLASS}`,
      getAttrs(dom): SubpageNodeAttrs | null {
        if (!(dom instanceof HTMLElement)) return null;

        const nodeID = uuid();
        const docID = dom.getAttribute('data-doc-id');
        const type = SubpageNodeType[dom.getAttribute('data-type') || 'large'];

        return {
          nodeID,
          docID,
          type
        };
      }
    }
  ],
  toDOM(node: Node) {
    const { nodeID, docID, type } = node.attrs as SubpageNodeAttrs;

    const attrs = {
      'data-node-id': nodeID,
      'data-doc-id': docID,
      'data-type': type,
      class: SUBPAGE_NODE_CLASS
    };

    return ['div', attrs];
  }
};
export default SubpageNodeSpec;
