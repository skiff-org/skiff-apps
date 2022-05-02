import Placeholder from '@tiptap/extension-placeholder';

import { Paragraph } from '../Extensions/EditorNodes';

export default Placeholder.extend({
  addStorage() {
    return {
      changed: false
    };
  },
  onTransaction({ transaction }) {
    if (transaction.docChanged) {
      this.storage.changed = true;
    }
  }
}).configure({
  showOnlyCurrent: true,
  includeChildren: true,
  placeholder: ({ node, pos, editor }) => {
    // Show only on the first paragraph
    if (node.type.name === Paragraph.name && pos === 0 && !editor.extensionStorage[Placeholder.name].changed)
      return 'Say hello';

    return '';
  }
});
