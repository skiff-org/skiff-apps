// Original file: ../../protos/com/skiff/skemail/grpc/skemail.proto

import type {
  SigningPublicKey as _com_skiff_skemail_grpc_SigningPublicKey,
  SigningPublicKey__Output as _com_skiff_skemail_grpc_SigningPublicKey__Output
} from '../../../../com/skiff/skemail/grpc/SigningPublicKey';

export interface EncryptedData {
  encryptedData?: string;
  signature?: string;
  signedBy?: _com_skiff_skemail_grpc_SigningPublicKey | null;
}

export interface EncryptedData__Output {
  encryptedData: string;
  signature: string;
  signedBy: _com_skiff_skemail_grpc_SigningPublicKey__Output | null;
}
