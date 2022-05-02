import { Editor } from '@tiptap/core';
import { EditorView } from 'prosemirror-view';
import { v4 } from 'uuid';

import { DecryptedAttachment } from '../../generated/graphql';
import { sha256 } from '../../utils/crypto/v1/hash';
import { convertFileListToArray, IMAGE_MIME_TYPES } from '../../utils/readFile';
import { b64toBlob, blobToB64, cidToSrc, createImagesFromFiles, getAllImagesInEditor } from '../MailEditor/Image/utils';
import { PmNodeToHtml } from '../MailEditor/mailEditorUtils';
import { AttachmentHeadersOptions, AttachmentTypes, LocalAttachmentStates, LocalOrRemoteAttachment } from './types';

const defaultAttachmentHeadersOptions = {
  attachmentType: 'attachment'
};

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
): Promise<{ inlineAttachments: LocalOrRemoteAttachment[]; messageWithInlineAttachments: string }> => {
  const images = getAllImagesInEditor(editor);
  let { tr } = editor.state;

  const inlineAttachments: LocalOrRemoteAttachment[] = [];
  const prepareImages = images.map(async ({ node, pos }) => {
    const blob = await b64toBlob(node.attrs.src);
    const b64ImageData = await blobToB64(blob);

    const attachmentID = v4();
    inlineAttachments.push({
      id: attachmentID,
      content: b64ImageData as string,
      inline: true,
      name: node.attrs.title,
      size: blob.size,
      state: LocalAttachmentStates.Success,
      type: AttachmentTypes.Local,
      contentType: blob.type
    });

    // we set the image src to cid
    tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: cidToSrc(attachmentID) });
  });

  await Promise.all(prepareImages);

  editor.view.dispatch(tr);

  // we take the current state snapshot for the message
  const messageWithInlineAttachments = PmNodeToHtml(tr.doc, editor.schema);

  tr = editor.state.tr;
  // and then we restore the image src to base64
  const restoreImagesSrc = images.map(async ({ node, pos }) => {
    const blob = await b64toBlob(node.attrs.src);
    const b64ImageData = await blobToB64(blob);

    tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: b64ImageData });
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
  const imagesFiles = filesArray.filter((file) => IMAGE_MIME_TYPES.includes(file.type));
  const nonImagesFiles = filesArray.filter((file) => !IMAGE_MIME_TYPES.includes(file.type));

  void createImagesFromFiles(imagesFiles, view);

  if (uploadAttachments) void uploadAttachments(nonImagesFiles);
};

export const isInline = (attachmentsMetadata: DecryptedAttachment) =>
  attachmentsMetadata.decryptedMetadata && attachmentsMetadata.decryptedMetadata.contentDisposition.includes('inline');
