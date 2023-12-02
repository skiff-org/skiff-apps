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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (node.type.name === Paragraph.name && pos === 0 && !editor.extensionStorage[Placeholder.name].changed)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return editor.extensionStorage[Placeholder.name].placeholderContent ?? `Write message`;
    return '';
  }
});
