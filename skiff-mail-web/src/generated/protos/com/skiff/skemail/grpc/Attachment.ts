// Original file: ../../protos/com/skiff/skemail/grpc/skemail.proto

import type {
  UUID as _com_skiff_common_UUID,
  UUID__Output as _com_skiff_common_UUID__Output
} from '../../../../com/skiff/common/UUID';
import type {
  EncryptedData as _com_skiff_skemail_grpc_EncryptedData,
  EncryptedData__Output as _com_skiff_skemail_grpc_EncryptedData__Output
} from '../../../../com/skiff/skemail/grpc/EncryptedData';

export interface _com_skiff_skemail_grpc_Attachment_S3Location {
  bucket?: string;
  key?: string;
  region?: string;
}

export interface _com_skiff_skemail_grpc_Attachment_S3Location__Output {
  bucket: string;
  key: string;
  region: string;
}

export interface Attachment {
  ID?: _com_skiff_common_UUID | null;
  encryptedAttachmentMetadata?: _com_skiff_skemail_grpc_EncryptedData | null;
  s3Location?: _com_skiff_skemail_grpc_Attachment_S3Location | null;
  attachmentLocation?: 's3Location';
}

export interface Attachment__Output {
  ID: _com_skiff_common_UUID__Output | null;
  encryptedAttachmentMetadata: _com_skiff_skemail_grpc_EncryptedData__Output | null;
  s3Location?: _com_skiff_skemail_grpc_Attachment_S3Location__Output | null;
}
