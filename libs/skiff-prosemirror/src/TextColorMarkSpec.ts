import { MarkSpec } from 'prosemirror-model';

import getColorForMarkSpec from './getColorForMarkSpec';

export const TEXT_COLOR_ATTRIBUTE = 'color';

const TextColorMarkSpec: MarkSpec = {
  attrs: {
    [TEXT_COLOR_ATTRIBUTE]: { default: '' }
  },
  inline: true,
  group: 'inline',
  parseDOM: [
    {
      style: 'color',
      getAttrs: (color) => {
        if (color instanceof Node) {
          return {};
        }
        return getColorForMarkSpec(color, 'color');
      }
    }
  ],

  toDOM(node) {
    const { color } = node.attrs;
    let style = '';

    if (color) {
      style += `color: ${color};`;
    }

    return [
      'span',
      {
        style
      },
      0
    ];
  }
};
export default TextColorMarkSpec;
