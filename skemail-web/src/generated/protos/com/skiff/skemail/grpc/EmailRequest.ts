// Original file: ../../protos/com/skiff/skemail/grpc/skemail.proto

import type {
  UUID as _com_skiff_common_UUID,
  UUID__Output as _com_skiff_common_UUID__Output
} from '../../../../com/skiff/common/UUID';

export interface EmailRequest {
  ID?: _com_skiff_common_UUID | null;
}

export interface EmailRequest__Output {
  ID: _com_skiff_common_UUID__Output | null;
}
