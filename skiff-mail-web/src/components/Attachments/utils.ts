import { Editor } from '@tiptap/core';
import { EditorView } from 'prosemirror-view';
import { convertFileListToArray, FileTypes, MIMETypes, sha256 } from 'skiff-front-utils';
import { DecryptedAttachment } from 'skiff-graphql';
import { v4 } from 'uuid';

import {
  b64toBlobOrURL,
  blobToB64,
  cidToSrc,
  createImagesFromFiles,
  getAllImagesInEditor
} from '../MailEditor/Image/utils';
import { PmNodeToHtml } from '../MailEditor/mailEditorUtils';

import { AttachmentHeadersOptions, AttachmentStates, ClientAttachment, ClientLocalAttachment } from './types';

const defaultAttachmentHeadersOptions = {
  attachmentType: 'attachment'
};

//TODO will have to remove the <> after emailsender update
export const generateCID = () => `<${v4()}@skiff>`;

export const createAttachmentHeaders = async (options: AttachmentHeadersOptions) => {
  const { attachmentType, fileName, content, contentID } = {
    ...defaultAttachmentHeadersOptions,
    ...options
  };

  return {
    contentDisposition: `${attachmentType}; ${fileName ? `filename="${fileName}"` : ''}`,
    checksum: await sha256(content),
    contentID: contentID ? contentID : generateCID()
  };
};

/**
 * This functions is called before sending.
 * It creates attachments from the current images in the editor,
 * and alters the images src to CID to the correct inline attachment
 */
export const prepareInlineAttachments = async (
  editor: Editor
): Promise<{ inlineAttachments: ClientAttachment[]; messageWithInlineAttachments: string }> => {
  const images = getAllImagesInEditor(editor);
  let { tr } = editor.state;

  const inlineAttachments: ClientAttachment[] = [];
  const prepareImages = images.map(async ({ node, pos }) => {
    if (typeof node?.attrs?.src !== 'string') {
      return;
    }
    const blobOrURL = b64toBlobOrURL(node.attrs.src);
    if (typeof blobOrURL === 'string') {
      // URL case
      // keep src as https://... URL
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: blobOrURL });
    } else {
      // using b64, need to attach
      const base64ImageData = await blobToB64(blobOrURL);
      const size = blobOrURL.size;
      const type = blobOrURL.type;

      const attachmentID = v4();
      inlineAttachments.push({
        id: attachmentID,
        content: base64ImageData as string,
        inline: true,
        name: typeof node.attrs?.title === 'string' ? node.attrs?.title ?? '' : '',
        size,
        state: AttachmentStates.Local,
        contentType: type
      });

      // we set the image src to cid
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: cidToSrc(attachmentID) });
    }
  });

  await Promise.all(prepareImages);

  editor.view.dispatch(tr);

  // we take the current state snapshot for the message
  const messageWithInlineAttachments = PmNodeToHtml(tr.doc, editor.schema);

  tr = editor.state.tr;
  // and then we restore the image src to base64
  const restoreImagesSrc = images.map(async ({ node, pos }) => {
    if (typeof node?.attrs?.src !== 'string') {
      return;
    }
    const blobOrURL = b64toBlobOrURL(node.attrs.src);
    // blob is either URL or blob
    const imageData = typeof blobOrURL === 'string' ? blobOrURL : await blobToB64(blobOrURL);

    tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: imageData });
  });

  await Promise.all(restoreImagesSrc);

  editor.view.dispatch(tr);

  return { inlineAttachments, messageWithInlineAttachments };
};

export const uploadFilesAsInlineAttachments = (
  files: FileList,
  view: EditorView,
  uploadAttachments?: (files: File[]) => void
) => {
  const filesArray = convertFileListToArray(files);
  const imagesFiles = filesArray.filter((file) => MIMETypes[FileTypes.Image].includes(file.type));
  const nonImagesFiles = filesArray.filter((file) => !MIMETypes[FileTypes.Image].includes(file.type));

  void createImagesFromFiles(imagesFiles, view);

  if (uploadAttachments) {
    uploadAttachments(nonImagesFiles);
  }
};

export const uploadFilesArrayAsInlineAttachments = async (
  filesArray: Array<File>,
  uploadAttachments?: (files: File[], inline: boolean, encoding?: BufferEncoding) => Promise<void>
) => {

  if (uploadAttachments) {
    await uploadAttachments(filesArray, true, 'utf-8');
  }
};

export function isClientLocalAttachment(attachment: ClientAttachment | ClientLocalAttachment): attachment is ClientLocalAttachment {
  return (attachment as ClientLocalAttachment).content !== undefined;
}

export const isInline = (attachmentsMetadata: DecryptedAttachment) =>
  attachmentsMetadata.decryptedMetadata && attachmentsMetadata.decryptedMetadata.contentDisposition.includes('inline');

/**
 * Get base64 from zip file for saving with RN
 * @param content Zip file Blob object
 * @returns base64 string
 */
export const getBase64FromZip = async (content: Blob) => {
  const b64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(content);
  });
  // Remove zip header from base64
  if (typeof b64 === 'string') {
    return b64.replace('data:application/zip;base64,', '');
  }
  return b64;
};
