import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { SkemailClient as _com_skiff_skemail_grpc_SkemailClient, SkemailDefinition as _com_skiff_skemail_grpc_SkemailDefinition } from './com/skiff/skemail/grpc/Skemail';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  com: {
    skiff: {
      common: {
        UUID: MessageTypeDefinition
      }
      skemail: {
        grpc: {
          Attachment: MessageTypeDefinition
          CustomDomainsResponse: MessageTypeDefinition
          EmailRequest: MessageTypeDefinition
          EmailResponse: MessageTypeDefinition
          EmptyRequest: MessageTypeDefinition
          EmptyResponse: MessageTypeDefinition
          EncryptedData: MessageTypeDefinition
          EncryptedSessionKey: MessageTypeDefinition
          PublicKey: MessageTypeDefinition
          PublicKeyWithoutSignature: MessageTypeDefinition
          SaveMessageRequest: MessageTypeDefinition
          SigningPublicKey: MessageTypeDefinition
          Skemail: SubtypeConstructor<typeof grpc.Client, _com_skiff_skemail_grpc_SkemailClient> & { service: _com_skiff_skemail_grpc_SkemailDefinition }
          UpdateStatusRequest: MessageTypeDefinition
        }
      }
    }
  }
}

