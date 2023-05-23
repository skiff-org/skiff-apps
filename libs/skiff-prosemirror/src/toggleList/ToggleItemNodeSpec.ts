import { NodeSpec } from 'prosemirror-model';

import { ALIGN_PATTERN } from '../listNodeSpecUtils';
import { PARAGRAPH, TOGGLE_ITEM_CONTENT, TOGGLE_ITEM_TITLE } from '../NodeNames';

export const TOGGLE_ITEM_CLASS = 'toggle-item';

function toggleItemGetAttrs(dom: Node | string) {
  const attrs: { align?: string } = {};

  if (!(dom instanceof HTMLElement)) {
    return false;
  }
  if (!dom.classList.contains(TOGGLE_ITEM_CLASS)) {
    return false;
  }

  const { textAlign } = dom.style;
  let align: string | null = dom.getAttribute('data-align') || textAlign || '';
  align = ALIGN_PATTERN.test(align) ? align : null;

  if (align) {
    attrs.align = align;
  }

  return attrs;
}

const ToggleItemNodeSpec: NodeSpec = {
  attrs: {
    align: { default: 0 },
    id: { default: null }
  },
  content: `${TOGGLE_ITEM_TITLE} ${TOGGLE_ITEM_CONTENT}{0,1}`, // {0,1} - can accepts zero or one units of TOGGLE_ITEM_CONTENT
  allowGapCursor: false,
  parseDOM: [
    {
      tag: 'li',
      getAttrs: toggleItemGetAttrs
    }
  ],

  toDOM(node) {
    const attrs: { class?: string; id?: string } = {};

    const { align } = node.attrs;

    if (align) {
      attrs['data-align'] = align;
    }

    attrs.class = `${TOGGLE_ITEM_CLASS} toggled`;

    return ['li', attrs, ['button', { class: TOGGLE_ITEM_CLASS }], ['div', 0]];
  }
};

export default ToggleItemNodeSpec;

const TOGGLE_ITEM_TITLE_CLASS = 'toggle-item-title';
export const ToggleItemTitleNodeSpec: NodeSpec = {
  attrs: {
    id: { default: null }
  },
  content: `${PARAGRAPH}`,
  allowGapCursor: false,
  parseDOM: [
    {
      tag: `div.${TOGGLE_ITEM_TITLE_CLASS}`,
      getAttrs: (dom: Node | string) => {
        const attrs = {};

        if (!(dom instanceof HTMLElement)) {
          return false;
        }
        if (!dom.classList.contains(TOGGLE_ITEM_TITLE_CLASS)) {
          return false;
        }
        return attrs;
      }
    }
  ],
  toDOM() {
    return ['div', { class: TOGGLE_ITEM_TITLE_CLASS }, 0];
  }
};

const TOGGLE_ITEM_CONTENT_CLASS = 'toggle-item-content';
export const ToggleItemContentNodeSpec: NodeSpec = {
  content: `block+`,
  allowGapCursor: false,
  parseDOM: [
    {
      tag: `div.${TOGGLE_ITEM_CONTENT_CLASS}`,
      getAttrs: (dom: Node | string) => {
        const attrs = {};

        if (!(dom instanceof HTMLElement)) {
          return false;
        }
        if (!dom.classList.contains(TOGGLE_ITEM_CONTENT_CLASS)) {
          return false;
        }
        return attrs;
      }
    }
  ],
  toDOM() {
    return ['div', { class: TOGGLE_ITEM_CONTENT_CLASS }, 0];
  }
};
