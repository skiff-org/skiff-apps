import { Node as PMNode, NodeSpec } from 'prosemirror-model';

import { ATTRIBUTE_LIST_STYLE_TYPE } from './ListItemNodeSpec';
import { LIST_ITEM } from './NodeNames';
import { ATTRIBUTE_INDENT, MIN_INDENT_LEVEL } from './ParagraphNodeSpec';

export const ATTRIBUTE_COUNTER_RESET = 'data-counter-reset';
export const ATTRIBUTE_FOLLOWING = 'data-following';
const AUTO_LIST_STYLE_TYPES = ['decimal', 'lower-alpha', 'lower-roman'];
const OrderedListNodeSpec: NodeSpec = {
  attrs: {
    id: {
      default: null
    },
    counterReset: {
      default: null
    },
    indent: {
      default: MIN_INDENT_LEVEL
    },
    following: {
      default: null
    },
    listStyleType: {
      default: null
    },
    name: {
      default: null
    },
    start: {
      default: 1
    }
  },
  group: 'block',
  content: `${LIST_ITEM}+`,
  parseDOM: [
    {
      tag: 'ol',

      getAttrs(dom: Node | string) {
        if (!(dom instanceof HTMLElement)) {
          return {};
        }
        const listStyleType = dom.getAttribute(ATTRIBUTE_LIST_STYLE_TYPE);
        const counterReset = dom.getAttribute(ATTRIBUTE_COUNTER_RESET) || undefined;
        const start = dom.hasAttribute('start') ? parseInt(dom.getAttribute('start') || '0', 10) : 1;
        const indent = dom.hasAttribute(ATTRIBUTE_INDENT)
          ? parseInt(dom.getAttribute(ATTRIBUTE_INDENT) || '0', 10)
          : MIN_INDENT_LEVEL;
        const name = dom.getAttribute('name') || undefined;
        const following = dom.getAttribute(ATTRIBUTE_FOLLOWING) || undefined;
        return {
          counterReset,
          following,
          indent,
          listStyleType,
          name,
          start
        };
      }
    }
  ],

  toDOM(node: PMNode) {
    const { start, indent, listStyleType, counterReset, following, name } = node.attrs;
    const attrs: Record<string, any> = {
      [ATTRIBUTE_INDENT]: indent
    };

    if (counterReset === 'none') {
      attrs[ATTRIBUTE_COUNTER_RESET] = counterReset;
    }

    if (following) {
      attrs[ATTRIBUTE_FOLLOWING] = following;
    }

    if (listStyleType) {
      attrs[ATTRIBUTE_LIST_STYLE_TYPE] = listStyleType;
    }

    if (start !== 1) {
      attrs.start = start;
    }

    if (name) {
      attrs.name = name;
    }

    let htmlListStyleType = listStyleType;

    if (!htmlListStyleType || htmlListStyleType === 'decimal') {
      htmlListStyleType = AUTO_LIST_STYLE_TYPES[indent % AUTO_LIST_STYLE_TYPES.length];
    }

    const cssCounterName = `skiff-counter-${indent}`;
    attrs.style =
      `--skiff-counter-name: ${cssCounterName};` +
      `--skiff-counter-reset: ${following ? 'none' : start - 1};` +
      `--skiff-list-style-type: ${htmlListStyleType}`;
    attrs.type = htmlListStyleType;
    return ['ol', attrs, 0];
  }
};
export default OrderedListNodeSpec;
