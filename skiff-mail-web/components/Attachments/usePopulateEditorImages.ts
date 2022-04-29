import { Editor } from '@tiptap/core';
import { useEffect } from 'react';

import { MailboxEmailInfo } from '../../models/email';
import { getAllImagesInEditor } from '../MailEditor/Image/utils';
import useDownloadAttachments from './useDownloadAttachments';

/**
 * Hydrate editor images with CID src, with data from the attachments
 */
const usePopulateEditorImages = (
  attachmentsMetadata: MailboxEmailInfo['decryptedAttachmentMetadata'],
  editor?: Editor | null
) => {
  const { inlineAttachments } = useDownloadAttachments(attachmentsMetadata);

  useEffect(() => {
    void (async () => {
      if (!editor) return;

      const { tr } = editor.state;
      // get all images nodes in the editor
      const images = await getAllImagesInEditor(editor);
      await Promise.allSettled(
        images.map(async ({ node, pos }) => {
          // handle only if has cid
          if (!node.attrs.src.includes('cid')) return;

          // get string after cid:[string]
          const cid = (node.attrs.src as string).match(/cid:(.*)/)?.[1];
          if (!cid) return;

          // find the inlineAttachments with the matching CID
          const content = inlineAttachments[`<${cid}>`];
          if (!content) return;

          // set the image src to the attachment content (image content)
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: content });
        })
      );

      editor.view.dispatch(tr);
    })();
  }, [editor, inlineAttachments]);
};
export default usePopulateEditorImages;
