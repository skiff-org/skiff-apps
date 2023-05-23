import { NodeSpec } from 'prosemirror-model';

const CSS_ROTATE_PATTERN = /rotate\(([0-9.]+)rad\)/i;
const EMPTY_CSS_VALUE = new Set(['0%', '0pt', '0px']);

function getAttrs(dom: Node | string) {
  if (!(dom instanceof HTMLElement)) {
    return {};
  }

  const { cssFloat, display, marginTop, marginLeft } = dom.style;
  let { width, height } = dom.style;
  let align = dom.getAttribute('data-align') || dom.getAttribute('align');

  if (align) {
    align = /(left|right|center)/.test(align) ? align : null;
  } else if (cssFloat === 'left' && !display) {
    align = 'left';
  } else if (cssFloat === 'right' && !display) {
    align = 'right';
  } else if (!cssFloat && display === 'block') {
    align = 'block';
  }

  width = width || dom.getAttribute('width') || '0';
  height = height || dom.getAttribute('height') || '0';

  let crop = null;
  let rotate = null;
  const { parentElement } = dom;

  if (parentElement instanceof HTMLElement) {
    // Special case for Google doc's image.
    const ps = parentElement.style;

    if (
      ps.display === 'inline-block' &&
      ps.overflow === 'hidden' &&
      ps.width &&
      ps.height &&
      marginLeft &&
      !EMPTY_CSS_VALUE.has(marginLeft) &&
      marginTop &&
      !EMPTY_CSS_VALUE.has(marginTop)
    ) {
      crop = {
        width: parseInt(ps.width, 10) || 0,
        height: parseInt(ps.height, 10) || 0,
        left: parseInt(marginLeft, 10) || 0,
        top: parseInt(marginTop, 10) || 0
      };
    }

    if (ps.transform) {
      // example: `rotate(1.57rad) translateZ(0px)`;
      const mm = ps.transform.match(CSS_ROTATE_PATTERN);

      if (mm && mm[1]) {
        rotate = parseFloat(mm[1]) || null;
      }
    }
  }

  return {
    align,
    alt: dom.getAttribute('alt') || null,
    crop,
    height: parseInt(height, 10) || null,
    rotate,
    src: dom.getAttribute('src') || null,
    title: dom.getAttribute('title') || null,
    width: parseInt(width, 10) || null
  };
}

// https://github.com/ProseMirror/prosemirror-schema-basic/blob/master/src/schema-basic.js
const ImageNodeSpec: NodeSpec = {
  inline: true,
  attrs: {
    align: {
      default: 'center'
    },
    alt: {
      default: ''
    },
    crop: {
      default: null
    },
    height: {
      default: null
    },
    rotate: {
      default: null
    },
    src: {
      default: null
    },
    title: {
      default: ''
    },
    width: {
      default: null
    }
  },
  group: 'inline',
  draggable: true,
  parseDOM: [
    {
      tag: 'img[src]',
      getAttrs
    }
  ],

  toDOM(node) {
    return ['img', { ...node.attrs }];
  }
};
export default ImageNodeSpec;
