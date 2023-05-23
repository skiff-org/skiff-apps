import { NodeSpec } from 'prosemirror-model';

import { LIST_TASK_ITEM } from './NodeNames';
import { ATTRIBUTE_INDENT, MIN_INDENT_LEVEL } from './ParagraphNodeSpec';

const TODO_LIST_CLASS = 'todo-list';

const TodoListNodeSpec: NodeSpec = {
  attrs: {
    id: { default: null },
    indent: { default: MIN_INDENT_LEVEL }
  },
  group: 'block',
  content: `${LIST_TASK_ITEM}+`,
  parseDOM: [
    {
      tag: 'ul',

      getAttrs(dom: string | Node) {
        if (!(dom instanceof HTMLElement)) {
          return {};
        }
        if (!dom.classList.contains(TODO_LIST_CLASS)) {
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

    attrs.class = TODO_LIST_CLASS;

    return ['ul', attrs, 0];
  }
};
export default TodoListNodeSpec;
