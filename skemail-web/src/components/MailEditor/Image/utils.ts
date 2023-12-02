import { Editor } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { contentAsDataUrl } from 'skiff-front-utils';

import { readFile } from '../../../utils/readFile';

/**
 * Convert b64 to blob.
 * See https://stackoverflow.com/questions/12168909/blob-from-dataurl
 */
export const b64toBlobOrURL = (dataURI: string) => {
  if (dataURI.trim().startsWith('data:')) {
    try {
      const byteString = window.atob(dataURI.split(',')[1] ?? '');
      // separate out the mime component
      const mimeString = dataURI.split(',')[0]?.split(':')[1]?.split(';')[0];
      if (mimeString == 'image/svg+xml') {
        throw Error('Converting SVGs to Blob URIs are prohibited due to XSS risk');
      }
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
    } catch (err) {}
  }
  return dataURI;
};

export const cidToSrc = (cid: string) => `cid:${cid}@skiff.town`;

export const blobToB64 = async (blob: Blob): Promise<string | ArrayBuffer | null | undefined> =>
  new Promise((resolve, reject) => {
    if (blob.type == 'image/svg+xml') {
      throw Error('Converting SVGs to Base64 URIs are prohibited due to XSS risk');
    }
    const reader = new FileReader();
    reader.onload = (res) => resolve(res.target?.result);
    reader.onerror = (err) => reject(err);
    reader.onabort = (err) => reject(err);

    // TODO: make sure fetch api is supported in all target browsers
    reader.readAsDataURL(blob);
  });

export const b64ToImageUrl = (dataUrl: string) => {
  const blobUrl = b64toBlobOrURL(dataUrl);
  if (typeof blobUrl === 'string') {
    // should never happen - we started with data URI
    return '';
  }

  if (blobUrl.type == 'image/svg+xml') {
    console.error('Displaying SVGs to Blob URIs are prohibited due to XSS risk');
    return '';
  }

  const urlCreator = window.URL || window.webkitURL;
  const imageUrl = urlCreator.createObjectURL(blobUrl);

  return imageUrl;
};

export async function createImagesFromFiles(
  imagesFiles: File[],
  view: EditorView
): Promise<{ success: boolean; errorType: string | null }[]> {
  const createImagesHandlers = imagesFiles.map(async (file) => {
    const { content: base64 } = await readFile(file, undefined);
    if (!base64) {
      console.error('No data found in file');
      return { success: false, errorType: 'Empty' };
    }
    if (file.type === 'image/svg+xml') {
      console.error('SVG files can only be sent as file attachments and not inline');
      return { success: false, errorType: 'SVG' };
    }
    const src = contentAsDataUrl(base64, file.type);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { state, dispatch } = view;
    const tr = state.tr;

    tr.replaceSelectionWith(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      state.schema.nodes[Image.name].createAndFill({
        src,
        title: file.name,
        alt: file.name,
        contentType: file.type,
        size: file.size
      }),
      false
    );

    dispatch(tr);
    return { success: true, errorType: null };
  });
  return Promise.all(createImagesHandlers);
}

export const getAllImagesInEditor = (editor: Editor): { node: Node; pos: number }[] => {
  const images: { node: Node; pos: number }[] = [];

  editor.view.state.doc.descendants((node, pos) => {
    if (node.type.name === Image.name) {
      images.push({ node, pos });
    }

    return true;
  });

  return images;
};
