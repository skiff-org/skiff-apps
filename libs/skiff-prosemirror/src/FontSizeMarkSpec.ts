import { DOMOutputSpec, MarkSpec } from 'prosemirror-model';

import { toClosestFontPxSize } from './convertToCSSPTValue';

const FontSizeMarkSpec: MarkSpec = {
  attrs: {
    pt: {
      default: null
    },
    px: {
      default: null
    }
  },
  inline: true,
  group: 'inline',
  parseDOM: [
    {
      style: 'font-size',
      getAttrs
    }
  ],

  toDOM(node): DOMOutputSpec {
    const { px, pt } = node.attrs;
    const domAttrs = px
      ? {
          style: `font-size: ${px}px;`,
          class: 'skiff-font-size-mark'
        }
      : pt
      ? {
          style: `font-size: ${toClosestFontPxSize(`${pt}pt`)}px`,
          class: 'skiff-font-size-mark'
        }
      : undefined;
    return ['span', domAttrs, 0];
  }
};

function getAttrs(fontSize: string | Node): Record<string, any> {
  if (fontSize instanceof Node) {
    return {};
  }
  const attrs = {};

  if (!fontSize) {
    return attrs;
  }

  const pxValue = toClosestFontPxSize(fontSize);

  if (!pxValue) {
    return attrs;
  }

  return {
    px: pxValue
  };
}

export default FontSizeMarkSpec;
