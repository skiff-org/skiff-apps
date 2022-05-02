import { Editor, Extension } from '@tiptap/core';

import { b64toBlob, getAllImagesInEditor } from '../Image/utils';

export const MESSAGE_MAX_SIZE = 25 * 1024 * 1024; // 25 MB

const getInlineAttachmentsSize = (editor: Editor) => {
  const allImagesInEditor = getAllImagesInEditor(editor);
  let size = 0;
  allImagesInEditor.forEach(async (imageNode) => {
    const { src } = imageNode.node.attrs;
    if (src.startsWith('data') && src.includes('base64')) {
      const blobSrc = await b64toBlob(src);
      size += blobSrc.size;
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
    this.storage.messageSize = getEditorContentSize(this.editor);
  }
});
