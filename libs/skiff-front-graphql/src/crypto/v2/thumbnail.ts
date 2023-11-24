import { Range } from 'semver';
import { createProtoWrapperDatagramV2 } from 'skiff-crypto';
import { DecryptedThumbnail, DecryptedThumbnailHeader } from 'skiff-mail-protos';

export const ThumbnailDatagram = createProtoWrapperDatagramV2(
  'skiff.file.thumbnail',
  DecryptedThumbnailHeader,
  DecryptedThumbnail,
  '0.1.0',
  new Range('0.1.*')
);
