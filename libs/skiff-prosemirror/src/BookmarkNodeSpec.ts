import { NodeSpec } from 'prosemirror-model';

export const ATTRIBUTE_BOOKMARK_ID = 'data-bookmark-id';
export const ATTRIBUTE_BOOKMARK_VISIBLE = 'data-bookmark-visible';

function getAttrs(dom: Node | string) {
  if (!(dom instanceof HTMLElement)) {
    return {};
  }
  const id = dom.getAttribute(ATTRIBUTE_BOOKMARK_ID);
  const visible = dom.getAttribute(ATTRIBUTE_BOOKMARK_VISIBLE) === 'true';
  return {
    id,
    visible
  };
}

const BookmarkNodeSpec: NodeSpec = {
  inline: true,
  attrs: {
    id: {
      default: null
    },
    visible: {
      default: null
    }
  },
  group: 'inline',
  draggable: true,
  parseDOM: [
    {
      tag: `a[${ATTRIBUTE_BOOKMARK_ID}]`,
      getAttrs
    }
  ],

  toDOM(node) {
    const { id, visible } = node.attrs;
    const attrs = id
      ? {
          [ATTRIBUTE_BOOKMARK_ID]: id,
          [ATTRIBUTE_BOOKMARK_VISIBLE]: visible,
          id
        }
      : {};
    return ['a', attrs];
  }
};
export default BookmarkNodeSpec;
