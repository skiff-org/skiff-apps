import { mergeAttributes, wrappingInputRule } from '@tiptap/core';
import BulletList from '@tiptap/extension-bullet-list';

import { bulletListStyling } from '../nodeStyles';

// Apply editor styling of ul to renderHtml for styling on email send
export default BulletList.extend({
  renderHTML({ HTMLAttributes }) {
    return ['ul', mergeAttributes(HTMLAttributes, { style: bulletListStyling }), 0];
  },
  addInputRules() {
    const inputRegex = /^\s*([+*])\s$/; // Excludes dashes from default BulletList regex.
    return [
      wrappingInputRule({
        find: inputRegex,
        type: this.type
      })
    ];
  }
});
