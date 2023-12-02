// Original file: ../../protos/com/skiff/skemail/grpc/skemail.proto

import type {
  UUID as _com_skiff_common_UUID,
  UUID__Output as _com_skiff_common_UUID__Output
} from '../../../../com/skiff/common/UUID';

export interface SaveMessageRequest {
  ID?: _com_skiff_common_UUID | null;
  smtpMessageID?: string;
}

export interface SaveMessageRequest__Output {
  ID: _com_skiff_common_UUID__Output | null;
  smtpMessageID: string;
}
