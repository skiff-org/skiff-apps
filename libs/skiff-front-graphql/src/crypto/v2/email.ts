import { Range } from 'semver';
import { createProtoWrapperDatagramV2 } from '@skiff-org/skiff-crypto';
import {
  AttachmentBody,
  AttachmentHeader,
  AttachmentMetadataBody,
  AttachmentMetadataHeader,
  MailHTMLBody,
  MailHTMLHeader,
  MailSubjectBody,
  MailSubjectHeader,
  MailTextAsHTMLBody,
  MailTextAsHTMLHeader,
  MailTextBody,
  MailTextHeader,
  RawMimeBody,
  RawMimeHeader
} from 'skiff-mail-protos';

// Datagram for encrypting/decrypting raw mime bodies.
export const RawMimeDatagram = createProtoWrapperDatagramV2(
  'skemail.rawMime',
  RawMimeHeader,
  RawMimeBody,
  '0.1.0',
  new Range('0.1.*')
);

// Datagram for encrypting/decrypting attachments.
export const AttachmentDatagram = createProtoWrapperDatagramV2(
  'skemail.attachment',
  AttachmentHeader,
  AttachmentBody,
  '0.1.0',
  new Range('0.1.*')
);
// Datagram for encrypting/decrypting attachment metadata.
export const AttachmentMetadataDatagram = createProtoWrapperDatagramV2(
  'skemail.attachmentMetadata',
  AttachmentMetadataHeader,
  AttachmentMetadataBody,
  '0.1.0',
  new Range('0.1.*')
);

export const MailSubjectDatagram = createProtoWrapperDatagramV2(
  'skemail.mailSubject',
  MailSubjectHeader,
  MailSubjectBody,
  '0.1.0',
  new Range('0.1.*')
);

export const MailTextDatagram = createProtoWrapperDatagramV2(
  'skemail.mailText',
  MailTextHeader,
  MailTextBody,
  '0.1.0',
  new Range('0.1.*')
);

export const MailHtmlDatagram = createProtoWrapperDatagramV2(
  'skemail.mailHtml',
  MailHTMLHeader,
  MailHTMLBody,
  '0.1.0',
  new Range('0.1.*')
);

export const MailTextAsHTMLDatagram = createProtoWrapperDatagramV2(
  'skemail.MailTextAsHTML',
  MailTextAsHTMLHeader,
  MailTextAsHTMLBody,
  '0.1.0',
  new Range('0.1.*')
);
