// Original file: ../../protos/com/skiff/skemail/grpc/skemail.proto

import type { UUID as _com_skiff_common_UUID, UUID__Output as _com_skiff_common_UUID__Output } from '../../common/UUID';

export interface UpdateStatusRequest {
  ID?: _com_skiff_common_UUID | null;
  status?: string;
  error?: string;
}

export interface UpdateStatusRequest__Output {
  ID: _com_skiff_common_UUID__Output | null;
  status: string;
  error: string;
}
