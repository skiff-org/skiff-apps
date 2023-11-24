import { Range } from 'semver';
import { createProtoWrapperDatagramV2 } from 'skiff-crypto';
import { DecryptedContactDataHeader, DecryptedContactData } from 'skiff-mail-protos';

export const EncryptedContactDataDatagram = createProtoWrapperDatagramV2(
  'skemail.contact',
  DecryptedContactDataHeader,
  DecryptedContactData,
  '0.1.0',
  new Range('0.1.*')
);
