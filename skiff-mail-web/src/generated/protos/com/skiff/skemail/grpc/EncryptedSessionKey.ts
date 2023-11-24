// Original file: ../../protos/com/skiff/skemail/grpc/skemail.proto

import type {
  PublicKeyWithoutSignature as _com_skiff_skemail_grpc_PublicKeyWithoutSignature,
  PublicKeyWithoutSignature__Output as _com_skiff_skemail_grpc_PublicKeyWithoutSignature__Output
} from '../../../../com/skiff/skemail/grpc/PublicKeyWithoutSignature';
import type {
  SigningPublicKey as _com_skiff_skemail_grpc_SigningPublicKey,
  SigningPublicKey__Output as _com_skiff_skemail_grpc_SigningPublicKey__Output
} from '../../../../com/skiff/skemail/grpc/SigningPublicKey';

export interface EncryptedSessionKey {
  encryptedSessionKey?: string;
  signature?: string;
  signedBy?: _com_skiff_skemail_grpc_SigningPublicKey | null;
  encryptedBy?: _com_skiff_skemail_grpc_PublicKeyWithoutSignature | null;
}

export interface EncryptedSessionKey__Output {
  encryptedSessionKey: string;
  signature: string;
  signedBy: _com_skiff_skemail_grpc_SigningPublicKey__Output | null;
  encryptedBy: _com_skiff_skemail_grpc_PublicKeyWithoutSignature__Output | null;
}
