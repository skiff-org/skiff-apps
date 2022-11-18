import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Plugin, PluginKey } from 'prosemirror-state';

import { imgStyling } from '../nodeStyles';

import ImageNodeView from './ImageNodeView';

const CLEAN_IMAGE_DRAG_ID = 'clean-image-drag-id';

export default Image.extend({
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('image-plugin'),
        props: {
          handleDOMEvents: {
            dragstart(_view, event) {
              const imageElement = event.target as HTMLElement;
              if (imageElement.nodeName !== 'IMG') return false;

              const cleanImage = document.createElement('img');
              cleanImage.src = imageElement.getAttribute('src') || '';
              cleanImage.style.maxWidth = '100px';
              cleanImage.id = CLEAN_IMAGE_DRAG_ID;
              document.body.appendChild(cleanImage);

              const { width, height } = cleanImage.getBoundingClientRect();
              event.dataTransfer?.setDragImage(cleanImage, width / 2, height / 2);
              return false;
            },
            dragend() {
              document.getElementById(CLEAN_IMAGE_DRAG_ID)?.remove();
              return false;
            }
          }
        }
      })
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
  addAttributes: () => ({
    src: { default: null },
    alt: { default: 'image' },
    title: { default: 'image' },
    contentType: { default: '' },
    size: { default: 0 }
  }),
  parseHTML() {
    return [
      {
        tag: 'img',
        priority: 100
      }
    ];
  },
  renderHTML({ node }) {
    const { src, alt, title } = node.attrs;
    return ['img', { alt, title, style: imgStyling, src }];
  },
  draggable: true,
  selectable: true,
  atom: true
}).configure({
  inline: true
});
