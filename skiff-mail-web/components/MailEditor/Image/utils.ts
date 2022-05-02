import { Editor } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';

import { readFile } from '../../../utils/readFile';

/**
 * Convert b64 to blob.
 * See https://stackoverflow.com/questions/12168909/blob-from-dataurl
 */
export const b64toBlob = async (dataURI: string) => {
  const isUrlSrc = dataURI.startsWith('http://') || dataURI.startsWith('https://');
  if (isUrlSrc) {
    return (await fetch(dataURI)).blob();
  }

  const byteString = window.atob(dataURI.split(',')[1]);
  // separate out the mime component
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  // write the bytes of the string to an ArrayBuffer
  const ab = new ArrayBuffer(byteString.length);
  // create a view into the buffer
  const ia = new Uint8Array(ab);
  // set the bytes of the buffer to the correct values
  for (let idx = 0; idx < byteString.length; idx++) {
    ia[idx] = byteString.charCodeAt(idx);
  }
  // write the ArrayBuffer to a blob, and you're done
  const blob = new Blob([ab], { type: mimeString });
  return blob;
};

export const cidToSrc = (cid: string) => `cid:${cid}@skiff.town`;

export const fileToBlobUrl = async (file: File) => {
  const { content: base64 } = await readFile(file, undefined);
  if (!base64) return '';

  const blobUrl = await b64toBlob(`data:${file.type};base64,${base64}`);
  const urlCreator = window.URL || window.webkitURL;
  const imageUrl = urlCreator.createObjectURL(blobUrl);

  return imageUrl;
};

export const blobToB64 = async (blob: Blob): Promise<string | ArrayBuffer | null | undefined> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (res) => resolve(res.target?.result);
    reader.onerror = (err) => reject(err);
    reader.onabort = (err) => reject(err);

    reader.readAsDataURL(blob);
  });

export const b64ToImageUrl = async (dataUrl: string) => {
  const blobUrl = await b64toBlob(dataUrl);
  const urlCreator = window.URL || window.webkitURL;
  const imageUrl = urlCreator.createObjectURL(blobUrl);

  return imageUrl;
};

export const createImagesFromFiles = (imagesFiles: File[], view: EditorView) => {
  const createImagesHandlers = imagesFiles.map(async (file) => {
    const { content: base64 } = await readFile(file, undefined);
    if (!base64) return '';
    const src = `data:${file.type};base64,${base64}`;
    const { state, dispatch } = view;
    const tr = state.tr;

    tr.replaceSelectionWith(
      state.schema.nodes[Image.name].createAndFill({
        src,
        title: file.name,
        alt: file.name
      }),
      false
    );

    dispatch(tr);
  });
  return Promise.all(createImagesHandlers);
};

export const getAllImagesInEditor = (editor: Editor): { node: Node; pos: number }[] => {
  const images: { node: Node; pos: number }[] = [];

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === Image.name) {
      images.push({ node, pos });
    }

    return true;
  });

  return images;
};
