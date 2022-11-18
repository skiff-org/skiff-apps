import Placeholder from '@tiptap/extension-placeholder';

import { Paragraph } from '../Extensions/EditorNodes';

export default Placeholder.extend({
  addStorage() {
    return {
      changed: false
    };
  }
}).configure({
  showOnlyCurrent: true,
  includeChildren: true,
  placeholder: ({ node, pos, editor }) => {
    // Show only on the first paragraph when user is not editing body
    if (node.type.name === Paragraph.name && pos === 0 && !editor.extensionStorage[Placeholder.name].changed)
      return 'Say hello';

    return '';
  }
});
