import { mergeAttributes } from '@tiptap/core';
import OrderedList from '@tiptap/extension-ordered-list';

import { orderedListStyling } from '../nodeStyles';

// Apply editor styling of li to renderHtml for styling on email send
export default OrderedList.extend({
  renderHTML({ HTMLAttributes, node }) {
    const el = document.querySelector(`[uuid='${node.attrs.uuid}']`);
    if (!el) {
      return ['ol', mergeAttributes(HTMLAttributes, { style: orderedListStyling() }), 0];
    }
    return [
      'ol',
      mergeAttributes(HTMLAttributes, { style: orderedListStyling(window.getComputedStyle(el).listStyleType) }),
      0
    ];
  }
});
