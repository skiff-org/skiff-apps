import { NodeSpec } from 'prosemirror-model';

export const DOC_DESCRIPTION_CLASS_NAME = 'doc-description';
// Index inside the doc - help with finding the node
export const DOC_DESCRIPTION_INDEX = 2;

export const DocDescriptionNodeSpec: NodeSpec = {
  parseDOM: [
    {
      tag: `div.${DOC_DESCRIPTION_CLASS_NAME}`,
      priority: 100
    }
  ],
  marks: '',
  toDOM(node) {
    return ['div', { class: DOC_DESCRIPTION_CLASS_NAME }, 0];
  },
  content: 'text*'
};
