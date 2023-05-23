import { Node, NodeSpec } from 'prosemirror-model';

import { ATTRIBUTE_LIST_STYLE_TYPE } from './ListItemNodeSpec';
import { checkIfGdocCheckbox } from './listNodeSpecUtils';
import { LIST_ITEM } from './NodeNames';
import { ATTRIBUTE_INDENT, MIN_INDENT_LEVEL } from './ParagraphNodeSpec';
import { TOGGLE_LIST_CLASS } from './toggleList/ToggleListNodeSpec';

const AUTO_LIST_STYLE_TYPES = ['disc', 'square', 'circle'];
const BulletListNodeSpec: NodeSpec = {
  attrs: {
    id: {
      default: null
    },
    indent: {
      default: MIN_INDENT_LEVEL
    },
    listStyleType: {
      default: null
    }
  },
  group: 'block',
  content: `${LIST_ITEM}+`,
  parseDOM: [
    {
      tag: 'ul',

      getAttrs(dom) {
        if (!(dom instanceof HTMLElement)) {
          return {};
        }
        // Fail the match if this is a task list
        if (
          dom.classList.contains(TOGGLE_LIST_CLASS) ||
          dom.classList.contains('todo-list') ||
          checkIfGdocCheckbox(dom.firstChild as HTMLElement)
        ) {
          return false;
        }
        const listStyleType = dom.getAttribute(ATTRIBUTE_LIST_STYLE_TYPE) || null;
        const indent = dom.hasAttribute(ATTRIBUTE_INDENT)
          ? parseInt(dom.getAttribute(ATTRIBUTE_INDENT) || '', 10)
          : MIN_INDENT_LEVEL;
        return {
          indent,
          listStyleType
        };
      }
    }
  ],

  toDOM(node: Node) {
    const { indent, listStyleType } = node.attrs;
    const attrs: {
      [ATTRIBUTE_INDENT]: string;
      type?: string;
    } = {
      [ATTRIBUTE_INDENT]: indent
    };

    if (listStyleType) {
      attrs[ATTRIBUTE_LIST_STYLE_TYPE] = listStyleType;
    }

    let htmlListStyleType = listStyleType;

    if (!htmlListStyleType || htmlListStyleType === 'disc') {
      htmlListStyleType = AUTO_LIST_STYLE_TYPES[indent % AUTO_LIST_STYLE_TYPES.length];
    }

    attrs.type = htmlListStyleType;
    return ['ul', attrs, 0];
  }
};
export default BulletListNodeSpec;
