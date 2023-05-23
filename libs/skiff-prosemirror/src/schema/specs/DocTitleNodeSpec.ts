import { NodeSpec } from 'prosemirror-model';

export const DOC_TITLE_CLASS_NAME = 'doc-title';
// Index inside the doc - help with finding the node
export const DOC_TITLE_INDEX = 1;

export const DocTitleNodeSpec: NodeSpec = {
  parseDOM: [
    {
      tag: `h1.${DOC_TITLE_CLASS_NAME}`,
      priority: 100
    }
  ],
  marks: '',
  toDOM() {
    return ['h1', { class: DOC_TITLE_CLASS_NAME }, 0];
  },
  content: 'text*'
};
