import { DOMOutputSpec, Node as PMNode, NodeSpec } from 'prosemirror-model';

import ParagraphNodeSpec, { getParagraphNodeAttrs, toParagraphDOM } from './ParagraphNodeSpec';

// https://github.com/ProseMirror/prosemirror-schema-basic/blob/master/src/schema-basic.js
// :: NodeSpec A plain paragraph textblock. Represented in the DOM
// as a `<p>` element.
const BlockquoteNodeSpec: NodeSpec = {
  ...ParagraphNodeSpec,
  defining: true,
  parseDOM: [
    {
      tag: 'blockquote',
      getAttrs
    }
  ],
  toDOM
};

function toDOM(node: PMNode): DOMOutputSpec {
  const dom = toParagraphDOM(node);
  dom[0] = 'blockquote';
  return dom;
}

function getAttrs(dom: Node | string) {
  if (!(dom instanceof HTMLElement)) {
    return {};
  }
  return getParagraphNodeAttrs(dom);
}

export default BlockquoteNodeSpec;
