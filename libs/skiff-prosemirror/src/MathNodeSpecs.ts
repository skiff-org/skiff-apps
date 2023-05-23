import { NodeSpec } from 'prosemirror-model';

export const MATH_DISPLAY_TAG = 'math-display';
const MATH_NODE_TAG = 'math-node';

export const MathInlineNodeSpec: NodeSpec = {
  group: 'inline math',
  content: 'text*',
  inline: true,
  atom: true,
  toDOM: () => [
    'math-inline',
    {
      class: MATH_NODE_TAG
    },
    0
  ],
  parseDOM: [
    {
      tag: 'math-inline'
    }
  ]
};
export const MathDisplayNodeSpec: NodeSpec = {
  group: 'block math',
  content: 'text*',
  atom: true,
  code: true,
  toDOM: () => [
    MATH_DISPLAY_TAG,
    {
      class: MATH_NODE_TAG
    },
    0
  ],
  parseDOM: [
    {
      tag: MATH_DISPLAY_TAG
    }
  ]
};
