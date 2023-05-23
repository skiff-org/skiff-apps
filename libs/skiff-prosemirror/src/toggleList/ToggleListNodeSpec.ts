import { NodeSpec } from 'prosemirror-model';

import { TOGGLE_LIST_ITEM } from '../NodeNames';
import { ATTRIBUTE_INDENT, MIN_INDENT_LEVEL } from '../ParagraphNodeSpec';

export const TOGGLE_LIST_CLASS = 'collapsable-toggle-list';

const ToggleListNodeSpec: NodeSpec = {
  attrs: {
    id: { default: null },
    indent: { default: MIN_INDENT_LEVEL }
  },
  group: 'block',
  content: `${TOGGLE_LIST_ITEM}+`,
  parseDOM: [
    {
      tag: `ul.${TOGGLE_LIST_CLASS}`,

      getAttrs(dom: string | Node) {
        if (!(dom instanceof HTMLElement)) {
          return false;
        }
        if (!dom.classList.contains(TOGGLE_LIST_CLASS)) {
          return false;
        }
        const indent = dom.hasAttribute(ATTRIBUTE_INDENT)
          ? parseInt(dom.getAttribute(ATTRIBUTE_INDENT) || '0', 10)
          : MIN_INDENT_LEVEL;

        return {
          indent
        };
      }
    }
  ],

  toDOM(node) {
    const { indent } = node.attrs;
    const attrs: { class?: string; [ATTRIBUTE_INDENT]: string } = {
      [ATTRIBUTE_INDENT]: indent
    };

    attrs.class = TOGGLE_LIST_CLASS;

    return ['ul', attrs, 0];
  }
};
export default ToggleListNodeSpec;
