// Original file: ../../protos/com/skiff/skemail/grpc/skemail.proto

import type * as grpc from '@grpc/grpc-js';
import type { MethodDefinition } from '@grpc/proto-loader';
import type {
  CustomDomainsResponse as _com_skiff_skemail_grpc_CustomDomainsResponse,
  CustomDomainsResponse__Output as _com_skiff_skemail_grpc_CustomDomainsResponse__Output
} from './CustomDomainsResponse';
import type {
  EmailRequest as _com_skiff_skemail_grpc_EmailRequest,
  EmailRequest__Output as _com_skiff_skemail_grpc_EmailRequest__Output
} from './EmailRequest';
import type {
  EmailResponse as _com_skiff_skemail_grpc_EmailResponse,
  EmailResponse__Output as _com_skiff_skemail_grpc_EmailResponse__Output
} from './EmailResponse';
import type {
  EmptyRequest as _com_skiff_skemail_grpc_EmptyRequest,
  EmptyRequest__Output as _com_skiff_skemail_grpc_EmptyRequest__Output
} from './EmptyRequest';
import type {
  EmptyResponse as _com_skiff_skemail_grpc_EmptyResponse,
  EmptyResponse__Output as _com_skiff_skemail_grpc_EmptyResponse__Output
} from './EmptyResponse';
import type {
  SaveMessageRequest as _com_skiff_skemail_grpc_SaveMessageRequest,
  SaveMessageRequest__Output as _com_skiff_skemail_grpc_SaveMessageRequest__Output
} from './SaveMessageRequest';
import type {
  UpdateStatusRequest as _com_skiff_skemail_grpc_UpdateStatusRequest,
  UpdateStatusRequest__Output as _com_skiff_skemail_grpc_UpdateStatusRequest__Output
} from './UpdateStatusRequest';

export interface SkemailClient extends grpc.Client {
  GetAllCustomDomains(
    argument: _com_skiff_skemail_grpc_EmptyRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_CustomDomainsResponse__Output>
  ): grpc.ClientUnaryCall;
  GetAllCustomDomains(
    argument: _com_skiff_skemail_grpc_EmptyRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_CustomDomainsResponse__Output>
  ): grpc.ClientUnaryCall;
  GetAllCustomDomains(
    argument: _com_skiff_skemail_grpc_EmptyRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_CustomDomainsResponse__Output>
  ): grpc.ClientUnaryCall;
  GetAllCustomDomains(
    argument: _com_skiff_skemail_grpc_EmptyRequest,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_CustomDomainsResponse__Output>
  ): grpc.ClientUnaryCall;
  getAllCustomDomains(
    argument: _com_skiff_skemail_grpc_EmptyRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_CustomDomainsResponse__Output>
  ): grpc.ClientUnaryCall;
  getAllCustomDomains(
    argument: _com_skiff_skemail_grpc_EmptyRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_CustomDomainsResponse__Output>
  ): grpc.ClientUnaryCall;
  getAllCustomDomains(
    argument: _com_skiff_skemail_grpc_EmptyRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_CustomDomainsResponse__Output>
  ): grpc.ClientUnaryCall;
  getAllCustomDomains(
    argument: _com_skiff_skemail_grpc_EmptyRequest,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_CustomDomainsResponse__Output>
  ): grpc.ClientUnaryCall;

  GetEmail(
    argument: _com_skiff_skemail_grpc_EmailRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmailResponse__Output>
  ): grpc.ClientUnaryCall;
  GetEmail(
    argument: _com_skiff_skemail_grpc_EmailRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmailResponse__Output>
  ): grpc.ClientUnaryCall;
  GetEmail(
    argument: _com_skiff_skemail_grpc_EmailRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmailResponse__Output>
  ): grpc.ClientUnaryCall;
  GetEmail(
    argument: _com_skiff_skemail_grpc_EmailRequest,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmailResponse__Output>
  ): grpc.ClientUnaryCall;
  getEmail(
    argument: _com_skiff_skemail_grpc_EmailRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmailResponse__Output>
  ): grpc.ClientUnaryCall;
  getEmail(
    argument: _com_skiff_skemail_grpc_EmailRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmailResponse__Output>
  ): grpc.ClientUnaryCall;
  getEmail(
    argument: _com_skiff_skemail_grpc_EmailRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmailResponse__Output>
  ): grpc.ClientUnaryCall;
  getEmail(
    argument: _com_skiff_skemail_grpc_EmailRequest,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmailResponse__Output>
  ): grpc.ClientUnaryCall;

  SaveMessageID(
    argument: _com_skiff_skemail_grpc_SaveMessageRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmptyResponse__Output>
  ): grpc.ClientUnaryCall;
  SaveMessageID(
    argument: _com_skiff_skemail_grpc_SaveMessageRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmptyResponse__Output>
  ): grpc.ClientUnaryCall;
  SaveMessageID(
    argument: _com_skiff_skemail_grpc_SaveMessageRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmptyResponse__Output>
  ): grpc.ClientUnaryCall;
  SaveMessageID(
    argument: _com_skiff_skemail_grpc_SaveMessageRequest,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmptyResponse__Output>
  ): grpc.ClientUnaryCall;
  saveMessageId(
    argument: _com_skiff_skemail_grpc_SaveMessageRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmptyResponse__Output>
  ): grpc.ClientUnaryCall;
  saveMessageId(
    argument: _com_skiff_skemail_grpc_SaveMessageRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmptyResponse__Output>
  ): grpc.ClientUnaryCall;
  saveMessageId(
    argument: _com_skiff_skemail_grpc_SaveMessageRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmptyResponse__Output>
  ): grpc.ClientUnaryCall;
  saveMessageId(
    argument: _com_skiff_skemail_grpc_SaveMessageRequest,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmptyResponse__Output>
  ): grpc.ClientUnaryCall;

  UpdateStatus(
    argument: _com_skiff_skemail_grpc_UpdateStatusRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmptyResponse__Output>
  ): grpc.ClientUnaryCall;
  UpdateStatus(
    argument: _com_skiff_skemail_grpc_UpdateStatusRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmptyResponse__Output>
  ): grpc.ClientUnaryCall;
  UpdateStatus(
    argument: _com_skiff_skemail_grpc_UpdateStatusRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmptyResponse__Output>
  ): grpc.ClientUnaryCall;
  UpdateStatus(
    argument: _com_skiff_skemail_grpc_UpdateStatusRequest,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmptyResponse__Output>
  ): grpc.ClientUnaryCall;
  updateStatus(
    argument: _com_skiff_skemail_grpc_UpdateStatusRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmptyResponse__Output>
  ): grpc.ClientUnaryCall;
  updateStatus(
    argument: _com_skiff_skemail_grpc_UpdateStatusRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmptyResponse__Output>
  ): grpc.ClientUnaryCall;
  updateStatus(
    argument: _com_skiff_skemail_grpc_UpdateStatusRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmptyResponse__Output>
  ): grpc.ClientUnaryCall;
  updateStatus(
    argument: _com_skiff_skemail_grpc_UpdateStatusRequest,
    callback: grpc.requestCallback<_com_skiff_skemail_grpc_EmptyResponse__Output>
  ): grpc.ClientUnaryCall;
}

export interface SkemailHandlers extends grpc.UntypedServiceImplementation {
  GetAllCustomDomains: grpc.handleUnaryCall<
    _com_skiff_skemail_grpc_EmptyRequest__Output,
    _com_skiff_skemail_grpc_CustomDomainsResponse
  >;

  GetEmail: grpc.handleUnaryCall<_com_skiff_skemail_grpc_EmailRequest__Output, _com_skiff_skemail_grpc_EmailResponse>;

  SaveMessageID: grpc.handleUnaryCall<
    _com_skiff_skemail_grpc_SaveMessageRequest__Output,
    _com_skiff_skemail_grpc_EmptyResponse
  >;

  UpdateStatus: grpc.handleUnaryCall<
    _com_skiff_skemail_grpc_UpdateStatusRequest__Output,
    _com_skiff_skemail_grpc_EmptyResponse
  >;
}

export interface SkemailDefinition extends grpc.ServiceDefinition {
  GetAllCustomDomains: MethodDefinition<
    _com_skiff_skemail_grpc_EmptyRequest,
    _com_skiff_skemail_grpc_CustomDomainsResponse,
    _com_skiff_skemail_grpc_EmptyRequest__Output,
    _com_skiff_skemail_grpc_CustomDomainsResponse__Output
  >;
  GetEmail: MethodDefinition<
    _com_skiff_skemail_grpc_EmailRequest,
    _com_skiff_skemail_grpc_EmailResponse,
    _com_skiff_skemail_grpc_EmailRequest__Output,
    _com_skiff_skemail_grpc_EmailResponse__Output
  >;
  SaveMessageID: MethodDefinition<
    _com_skiff_skemail_grpc_SaveMessageRequest,
    _com_skiff_skemail_grpc_EmptyResponse,
    _com_skiff_skemail_grpc_SaveMessageRequest__Output,
    _com_skiff_skemail_grpc_EmptyResponse__Output
  >;
  UpdateStatus: MethodDefinition<
    _com_skiff_skemail_grpc_UpdateStatusRequest,
    _com_skiff_skemail_grpc_EmptyResponse,
    _com_skiff_skemail_grpc_UpdateStatusRequest__Output,
    _com_skiff_skemail_grpc_EmptyResponse__Output
  >;
}
