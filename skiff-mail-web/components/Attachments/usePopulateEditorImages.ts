import { Editor } from '@tiptap/core';
import { useEffect } from 'react';
import { contentAsDataUrl } from 'skiff-front-utils';

import { getAllImagesInEditor } from '../MailEditor/Image/utils';

import { ClientAttachment } from './types';
import { hasContent } from './typeUtils';

/**
 * Hydrate editor images with CID src, with data from the attachments
 */
const usePopulateEditorImages = (attachments: ClientAttachment[], editor?: Editor | null) => {
  useEffect(() => {
    void (() => {
      if (!editor || !attachments.length) return;

      const { tr } = editor.state;
      // get all images nodes in the editor
      const images = getAllImagesInEditor(editor);

      images.map(({ node, pos }) => {
        // handle only if has cid
        if (!(node.attrs.src as string).includes('cid')) return;

        // get string after cid:[string]
        const cid = (node.attrs.src as string).match(/cid:(.*)/)?.[1];
        if (!cid) return;

        const attachment = attachments.find((attach) => attach.contentID === `<${cid}>`);
        if (!attachment || !hasContent(attachment)) return;

        const content = contentAsDataUrl(attachment.content, attachment.contentType);

        // set the image src to the attachment content (image content)
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: content });
      });

      editor.view.dispatch(tr);
    })();
  }, [editor, attachments]);
};
export default usePopulateEditorImages;
