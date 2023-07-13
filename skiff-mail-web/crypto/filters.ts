import { Range } from 'semver';
import { createProtoWrapperDatagramV2 } from '@skiff-org/skiff-crypto';
import { FilterSerializedDataHeader, FilterSerializedDataBody } from 'skiff-mail-protos';

export const SubjectTextDatagram = createProtoWrapperDatagramV2(
  'filter.subject',
  FilterSerializedDataHeader,
  FilterSerializedDataBody,
  '0.1.0',
  new Range('0.1.*')
);

export const BodyTextDatagram = createProtoWrapperDatagramV2(
  'filter.body',
  FilterSerializedDataHeader,
  FilterSerializedDataBody,
  '0.1.0',
  new Range('0.1.*')
);
