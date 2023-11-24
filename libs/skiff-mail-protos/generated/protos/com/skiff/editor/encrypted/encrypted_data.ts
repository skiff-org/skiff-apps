/* eslint-disable */
import Long from 'long';
import _m0 from 'protobufjs/minimal';

export const protobufPackage = '';

export interface DecryptedThumbnailHeader {}

export interface DecryptedThumbnail {
  decryptedThumbnail: string;
}

function createBaseDecryptedThumbnailHeader(): DecryptedThumbnailHeader {
  return {};
}

export const DecryptedThumbnailHeader = {
  encode(_: DecryptedThumbnailHeader, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DecryptedThumbnailHeader {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDecryptedThumbnailHeader();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(_: any): DecryptedThumbnailHeader {
    return {};
  },

  toJSON(_: DecryptedThumbnailHeader): unknown {
    const obj: any = {};
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<DecryptedThumbnailHeader>, I>>(_: I): DecryptedThumbnailHeader {
    const message = createBaseDecryptedThumbnailHeader();
    return message;
  }
};

function createBaseDecryptedThumbnail(): DecryptedThumbnail {
  return { decryptedThumbnail: '' };
}

export const DecryptedThumbnail = {
  encode(message: DecryptedThumbnail, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.decryptedThumbnail !== '') {
      writer.uint32(10).string(message.decryptedThumbnail);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DecryptedThumbnail {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDecryptedThumbnail();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.decryptedThumbnail = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): DecryptedThumbnail {
    return {
      decryptedThumbnail: isSet(object.decryptedThumbnail) ? String(object.decryptedThumbnail) : ''
    };
  },

  toJSON(message: DecryptedThumbnail): unknown {
    const obj: any = {};
    message.decryptedThumbnail !== undefined && (obj.decryptedThumbnail = message.decryptedThumbnail);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<DecryptedThumbnail>, I>>(object: I): DecryptedThumbnail {
    const message = createBaseDecryptedThumbnail();
    message.decryptedThumbnail = object.decryptedThumbnail ?? '';
    return message;
  }
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin
  ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & Record<Exclude<keyof I, KeysOfUnion<P>>, never>;

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
