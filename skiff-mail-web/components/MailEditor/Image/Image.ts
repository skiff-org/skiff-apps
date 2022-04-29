import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';

import ImageNodeView from './ImageNodeView';

export default Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
  addAttributes: () => ({
    src: { default: null },
    alt: { default: 'image' },
    title: { default: 'image' }
  }),
  parseHTML() {
    return [
      {
        tag: 'img',
        priority: 100
      }
    ];
  },
  draggable: true,
  selectable: true,
  atom: true
}).configure({
  inline: true
});
