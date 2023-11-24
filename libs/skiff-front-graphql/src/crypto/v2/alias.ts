import { Range } from 'semver';
import { createProtoWrapperDatagramV2 } from 'skiff-crypto';
import { DecryptedAliasData, DecryptedAliasDataHeader } from 'skiff-mail-protos';

export const EncryptedAliasDataDatagram = createProtoWrapperDatagramV2(
  'skemail.alias',
  DecryptedAliasDataHeader,
  DecryptedAliasData,
  '0.1.0',
  new Range('0.1.*')
);
