const FILE_EMBED_NODE_CLASS = 'subpage-node';

import { Node, NodeSpec } from 'prosemirror-model';

import uuid from './ui/uuid';

/**
 * Ndoe for an embedded file inside a document.
 */
export interface FileEmbedNodeAttrs {
  nodeID: string;
  name: string | null;
  type: string | null;
  size: string | null;
  src: string | null;
}

const FileEmbedNodeSpec: NodeSpec = {
  attrs: {
    nodeID: { default: '' },
    name: { default: '' },
    type: { default: '' },
    size: { default: '' },
    src: { default: '' }
  },
  group: 'block',
  atom: false,
  selectable: false,
  draggable: true,
  parseDOM: [
    {
      tag: `div.${FILE_EMBED_NODE_CLASS}`,
      getAttrs(dom): FileEmbedNodeAttrs | null {
        if (!(dom instanceof HTMLElement)) return null;

        const nodeID = uuid();
        const name = dom.getAttribute('data-doc-name');
        const type = dom.getAttribute('data-type');
        const size = dom.getAttribute('data-size');
        const src = dom.getAttribute('data-src');

        return {
          nodeID,
          name,
          type,
          size,
          src
        };
      }
    }
  ],
  toDOM(node: Node) {
    const { nodeID, name, type, size, src } = node.attrs as FileEmbedNodeAttrs;

    const attrs = {
      'data-node-id': nodeID,
      'data-doc-name': name,
      'data-type': type,
      'data-size': size,
      'data-src': src,
      class: FILE_EMBED_NODE_CLASS
    };

    return ['div', attrs];
  }
};
export default FileEmbedNodeSpec;
