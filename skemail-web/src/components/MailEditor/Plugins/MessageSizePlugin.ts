import { Editor, Extension } from '@tiptap/core';
import { isDataUrl } from 'skiff-front-utils';

import { b64toBlobOrURL, getAllImagesInEditor } from '../Image/utils';

export const MESSAGE_MAX_SIZE_IN_MB = 25;
export const MESSAGE_MAX_SIZE_IN_BYTES = MESSAGE_MAX_SIZE_IN_MB * 1024 * 1024; // 25 MB

const getInlineAttachmentsSize = (editor: Editor) => {
  const allImagesInEditor = getAllImagesInEditor(editor);
  let size = 0;
  allImagesInEditor.forEach((imageNode) => {
    const src = String(imageNode.node.attrs.src);
    if (!src) return 0;
    if (isDataUrl(src) && src.includes('base64')) {
      const blobSrc = b64toBlobOrURL(src);
      if (typeof blobSrc !== 'string') {
        size += blobSrc.size;
      }
    }
  });

  return size;
};

const getEditorContentSize = (editor: Editor) => {
  const textContentSize = new Blob([editor.state.doc.textContent]).size;
  const inlineAttachmentsSize = getInlineAttachmentsSize(editor);

  return textContentSize + inlineAttachmentsSize;
};

export const MessageSizeExtension = Extension.create({
  name: 'messageSizeExtension',
  addStorage() {
    return {
      messageSize: 0
    };
  },
  onUpdate() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.storage.messageSize = getEditorContentSize(this.editor);
  }
});
