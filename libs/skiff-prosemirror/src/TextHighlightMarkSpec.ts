import { MarkSpec } from 'prosemirror-model';

import getColorForMarkSpec from './getColorForMarkSpec';

export const TEXT_HIGHLIGHT_COLOR_ATTRIBUTE = 'highlightColor';

const TextHighlightMarkSpec: MarkSpec = {
  attrs: {
    [TEXT_HIGHLIGHT_COLOR_ATTRIBUTE]: { default: '' }
  },
  inline: true,
  group: 'inline',
  parseDOM: [
    {
      tag: 'span[style*=background-color]',
      getAttrs: (dom) => {
        if (!(dom instanceof HTMLElement)) {
          return {};
        }
        const { background } = dom.style;
        return getColorForMarkSpec(background, 'highlightColor');
      }
    }
  ],

  toDOM(node) {
    const { highlightColor } = node.attrs;
    let style = '';

    if (highlightColor) {
      style += `background: ${highlightColor};`;
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
export default TextHighlightMarkSpec;
