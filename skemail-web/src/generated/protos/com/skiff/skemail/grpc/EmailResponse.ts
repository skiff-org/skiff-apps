// Original file: ../../protos/com/skiff/skemail/grpc/skemail.proto

import type {
  Attachment as _com_skiff_skemail_grpc_Attachment,
  Attachment__Output as _com_skiff_skemail_grpc_Attachment__Output
} from '../../../../com/skiff/skemail/grpc/Attachment';
import type {
  EncryptedData as _com_skiff_skemail_grpc_EncryptedData,
  EncryptedData__Output as _com_skiff_skemail_grpc_EncryptedData__Output
} from '../../../../com/skiff/skemail/grpc/EncryptedData';
import type {
  EncryptedSessionKey as _com_skiff_skemail_grpc_EncryptedSessionKey,
  EncryptedSessionKey__Output as _com_skiff_skemail_grpc_EncryptedSessionKey__Output
} from '../../../../com/skiff/skemail/grpc/EncryptedSessionKey';

export interface _com_skiff_skemail_grpc_EmailResponse_AddressObject {
  address?: string;
  name?: string;
}

export interface _com_skiff_skemail_grpc_EmailResponse_AddressObject__Output {
  address: string;
  name: string;
}

export interface EmailResponse {
  from?: _com_skiff_skemail_grpc_EmailResponse_AddressObject | null;
  to?: _com_skiff_skemail_grpc_EmailResponse_AddressObject[];
  cc?: _com_skiff_skemail_grpc_EmailResponse_AddressObject[];
  bcc?: _com_skiff_skemail_grpc_EmailResponse_AddressObject[];
  subject?: string;
  body?: string;
  attachment?: _com_skiff_skemail_grpc_Attachment[];
  EncryptedSessionKey?: _com_skiff_skemail_grpc_EncryptedSessionKey | null;
  EncryptedMailSubject?: _com_skiff_skemail_grpc_EncryptedData | null;
  EncryptedMailHTML?: _com_skiff_skemail_grpc_EncryptedData | null;
  EncryptedMailText?: _com_skiff_skemail_grpc_EncryptedData | null;
  EncryptedMailTextAsHTML?: _com_skiff_skemail_grpc_EncryptedData | null;
  senderUserID?: string;
}

export interface EmailResponse__Output {
  from: _com_skiff_skemail_grpc_EmailResponse_AddressObject__Output | null;
  to: _com_skiff_skemail_grpc_EmailResponse_AddressObject__Output[];
  cc: _com_skiff_skemail_grpc_EmailResponse_AddressObject__Output[];
  bcc: _com_skiff_skemail_grpc_EmailResponse_AddressObject__Output[];
  subject: string;
  body: string;
  attachment: _com_skiff_skemail_grpc_Attachment__Output[];
  EncryptedSessionKey: _com_skiff_skemail_grpc_EncryptedSessionKey__Output | null;
  EncryptedMailSubject: _com_skiff_skemail_grpc_EncryptedData__Output | null;
  EncryptedMailHTML: _com_skiff_skemail_grpc_EncryptedData__Output | null;
  EncryptedMailText: _com_skiff_skemail_grpc_EncryptedData__Output | null;
  EncryptedMailTextAsHTML: _com_skiff_skemail_grpc_EncryptedData__Output | null;
  senderUserID: string;
}
