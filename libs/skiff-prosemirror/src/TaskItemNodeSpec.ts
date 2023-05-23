import { NodeSpec } from 'prosemirror-model';

import { ALIGN_PATTERN, gdocCheckboxIsChecked } from './listNodeSpecUtils';

export const ATTRIBUTE_CHECKED = 'checked';
export const TASK_ITEM_CLASS = 'list-task';

function getAttrs(dom: Node | string) {
  const attrs: { align?: string } = {};

  if (!(dom instanceof HTMLElement)) {
    return attrs;
  }
  if (!dom.classList.contains(TASK_ITEM_CLASS)) {
    return false;
  }

  attrs[ATTRIBUTE_CHECKED] = dom.classList.contains('checked') || gdocCheckboxIsChecked(dom);

  const { textAlign } = dom.style;
  let align: string | null = dom.getAttribute('data-align') || textAlign || '';
  align = ALIGN_PATTERN.test(align) ? align : null;

  if (align) {
    attrs.align = align;
  }

  return attrs;
}

const TaskItemNodeSpec: NodeSpec = {
  attrs: {
    align: { default: null },
    [ATTRIBUTE_CHECKED]: { default: false }
  },

  content: 'paragraph',
  parseDOM: [
    {
      tag: 'li',
      getAttrs
    }
  ],

  toDOM(node) {
    const attrs: { class?: string } = {};

    const { align, checked } = node.attrs;

    if (align) {
      attrs['data-align'] = align;
    }

    attrs.class = `${TASK_ITEM_CLASS}${checked ? ' checked' : ''}`;

    return ['li', attrs, ['button', { class: TASK_ITEM_CLASS }], ['span', 0]];
  }
};

export default TaskItemNodeSpec;
