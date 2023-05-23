import { DOMOutputSpec, Node as PMNode, NodeSpec } from 'prosemirror-model';

import ParagraphNodeSpec, { getParagraphNodeAttrs, toParagraphDOM } from './ParagraphNodeSpec';

const TAG_NAME_TO_LEVEL = {
  H1: 1,
  H2: 2,
  H3: 3,
  H4: 4,
  H5: 5,
  H6: 6
};
// https://github.com/ProseMirror/prosemirror-schema-basic/blob/master/src/schema-basic.js
// :: NodeSpec A plain paragraph textblock. Represented in the DOM
// as a `<p>` element.
const HeadingNodeSpec: NodeSpec = {
  ...ParagraphNodeSpec,
  attrs: {
    ...ParagraphNodeSpec.attrs,
    level: {
      default: 1
    }
  },
  defining: true,
  parseDOM: [
    {
      tag: 'h1',
      getAttrs
    },
    {
      tag: 'h2',
      getAttrs
    },
    {
      tag: 'h3',
      getAttrs
    },
    {
      tag: 'h4',
      getAttrs
    },
    {
      tag: 'h5',
      getAttrs
    },
    {
      tag: 'h6',
      getAttrs
    }
  ],
  toDOM
};

function toDOM(node: PMNode): DOMOutputSpec {
  const dom = toParagraphDOM(node);
  const level = node.attrs.level || 1;
  dom[0] = `h${level}`;
  return dom;
}

function getAttrs(dom: string | Node): Record<string, any> {
  if (!(dom instanceof HTMLElement)) {
    return {};
  }
  const attrs: Record<string, any> = getParagraphNodeAttrs(dom);
  const level = TAG_NAME_TO_LEVEL[dom.nodeName.toUpperCase()] || 1;
  attrs.level = level;
  return attrs;
}

export default HeadingNodeSpec;
