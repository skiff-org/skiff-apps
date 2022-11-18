import { Editor, getSchema } from '@tiptap/react';
import { DOMParser as PMDomParser, DOMSerializer, Node, Schema } from 'prosemirror-model';

import { MailboxEmailInfo } from '../../../models/email';
import { sanitizeSignature } from '../../../utils/signatureUtils';
import { buildEditorExtensions } from '../Extensions';

export const PmNodeToHtml = (doc: Node, schema: Schema) => {
  const htmlFragment = DOMSerializer.fromSchema(schema).serializeFragment(doc.content);
  const detachedDocument = document.implementation.createHTMLDocument();
  const div = detachedDocument.createElement('div');
  div.appendChild(htmlFragment);
  return div.innerHTML;
};

export const fromEditorToHtml = (editor: Editor) => {
  const doc = editor.view.state.doc;
  return PmNodeToHtml(doc, editor.schema);
};

// TODO: Optimize this to take in multiple strings and return multiple text
// so we can skip the Editor instantiation for each one
export const convertHtmlToTextContent = (html: string) => {
  const schema = getSchema(buildEditorExtensions());

  const detachedDocument = document.implementation.createHTMLDocument();
  const div = detachedDocument.createElement('div');
  // eslint-disable-next-line no-unsanitized/property
  div.innerHTML = html;
  const parentNode = PMDomParser.fromSchema(schema).parse(div);

  let str = '';
  parentNode.content.forEach((node) => {
    str += node.textContent + '\t';
  });
  return str;
};

/** Helper for getting the HTML content of an email, defaulting to text if not set */
export const getEmailBody = (email: MailboxEmailInfo) =>
  email.decryptedHtml || email.decryptedTextAsHtml || email.decryptedText || '';

export const createReplyInitialContent = (email: MailboxEmailInfo, signature?: string) => {
  // User signature
  const signatureHtml = !!signature ? sanitizeSignature(signature) : '';
  // Details of email being replied to
  const dateAndName = `On ${(email.createdAt as Date).toUTCString()}${email.from.name ? `, ${email.from.name}` : ''}`;
  const emailAddress = `${email.from.address} wrote:`;
  const sender = email.from.name || email.from.address;
  const body = getEmailBody(email);

  return `
    <p></p>
    <blockquote class="skiff_quote" data-skiff-sender="${sender}" data-skiff-mail="true">
        <p>${dateAndName}</p>
        <p>${emailAddress}</p>
        <p></p>
        ${body}
    </blockquote>
    ${signatureHtml}
    `;
};
