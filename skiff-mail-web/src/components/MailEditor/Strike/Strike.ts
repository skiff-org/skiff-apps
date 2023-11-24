import Strike from '@tiptap/extension-strike';

import { strikethroughStyling } from '../nodeStyles';

export default Strike.extend({
  renderHTML() {
    return ['s', { style: strikethroughStyling }, 0];
  }
});
