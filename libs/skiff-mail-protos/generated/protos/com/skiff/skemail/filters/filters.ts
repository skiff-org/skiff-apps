/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "com.skiff.skemail.filters";

export interface MailFilterHeader {
}

/** MailFilter is a filter that can be applied to a mail message. */
export interface MailFilterBody {
  filterType: string;
  filterField?:
    | string
    | undefined;
  /** any JSON */
  serializedData?: string | undefined;
  subFilter: MailFilterBody[];
}

export interface FilterActionHeader {
}

export interface SingleFilterAction {
  actionType: string;
  /** any JSON */
  serializedData?: string | undefined;
}

export interface FilterActionBody {
  actions: SingleFilterAction[];
}

export interface FilterSerializedDataHeader {
}

export interface FilterSerializedDataBody {
  text: string;
}

function createBaseMailFilterHeader(): MailFilterHeader {
  return {};
}

export const MailFilterHeader = {
  encode(_: MailFilterHeader, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MailFilterHeader {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMailFilterHeader();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): MailFilterHeader {
    return {};
  },

  toJSON(_: MailFilterHeader): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<MailFilterHeader>, I>>(base?: I): MailFilterHeader {
    return MailFilterHeader.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MailFilterHeader>, I>>(_: I): MailFilterHeader {
    const message = createBaseMailFilterHeader();
    return message;
  },
};

function createBaseMailFilterBody(): MailFilterBody {
  return { filterType: "", filterField: undefined, serializedData: undefined, subFilter: [] };
}

export const MailFilterBody = {
  encode(message: MailFilterBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.filterType !== "") {
      writer.uint32(10).string(message.filterType);
    }
    if (message.filterField !== undefined) {
      writer.uint32(18).string(message.filterField);
    }
    if (message.serializedData !== undefined) {
      writer.uint32(26).string(message.serializedData);
    }
    for (const v of message.subFilter) {
      MailFilterBody.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MailFilterBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMailFilterBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.filterType = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.filterField = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.serializedData = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.subFilter.push(MailFilterBody.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): MailFilterBody {
    return {
      filterType: isSet(object.filterType) ? String(object.filterType) : "",
      filterField: isSet(object.filterField) ? String(object.filterField) : undefined,
      serializedData: isSet(object.serializedData) ? String(object.serializedData) : undefined,
      subFilter: Array.isArray(object?.subFilter) ? object.subFilter.map((e: any) => MailFilterBody.fromJSON(e)) : [],
    };
  },

  toJSON(message: MailFilterBody): unknown {
    const obj: any = {};
    message.filterType !== undefined && (obj.filterType = message.filterType);
    message.filterField !== undefined && (obj.filterField = message.filterField);
    message.serializedData !== undefined && (obj.serializedData = message.serializedData);
    if (message.subFilter) {
      obj.subFilter = message.subFilter.map((e) => e ? MailFilterBody.toJSON(e) : undefined);
    } else {
      obj.subFilter = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<MailFilterBody>, I>>(base?: I): MailFilterBody {
    return MailFilterBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MailFilterBody>, I>>(object: I): MailFilterBody {
    const message = createBaseMailFilterBody();
    message.filterType = object.filterType ?? "";
    message.filterField = object.filterField ?? undefined;
    message.serializedData = object.serializedData ?? undefined;
    message.subFilter = object.subFilter?.map((e) => MailFilterBody.fromPartial(e)) || [];
    return message;
  },
};

function createBaseFilterActionHeader(): FilterActionHeader {
  return {};
}

export const FilterActionHeader = {
  encode(_: FilterActionHeader, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FilterActionHeader {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFilterActionHeader();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): FilterActionHeader {
    return {};
  },

  toJSON(_: FilterActionHeader): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<FilterActionHeader>, I>>(base?: I): FilterActionHeader {
    return FilterActionHeader.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FilterActionHeader>, I>>(_: I): FilterActionHeader {
    const message = createBaseFilterActionHeader();
    return message;
  },
};

function createBaseSingleFilterAction(): SingleFilterAction {
  return { actionType: "", serializedData: undefined };
}

export const SingleFilterAction = {
  encode(message: SingleFilterAction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.actionType !== "") {
      writer.uint32(10).string(message.actionType);
    }
    if (message.serializedData !== undefined) {
      writer.uint32(18).string(message.serializedData);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SingleFilterAction {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSingleFilterAction();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.actionType = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.serializedData = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SingleFilterAction {
    return {
      actionType: isSet(object.actionType) ? String(object.actionType) : "",
      serializedData: isSet(object.serializedData) ? String(object.serializedData) : undefined,
    };
  },

  toJSON(message: SingleFilterAction): unknown {
    const obj: any = {};
    message.actionType !== undefined && (obj.actionType = message.actionType);
    message.serializedData !== undefined && (obj.serializedData = message.serializedData);
    return obj;
  },

  create<I extends Exact<DeepPartial<SingleFilterAction>, I>>(base?: I): SingleFilterAction {
    return SingleFilterAction.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SingleFilterAction>, I>>(object: I): SingleFilterAction {
    const message = createBaseSingleFilterAction();
    message.actionType = object.actionType ?? "";
    message.serializedData = object.serializedData ?? undefined;
    return message;
  },
};

function createBaseFilterActionBody(): FilterActionBody {
  return { actions: [] };
}

export const FilterActionBody = {
  encode(message: FilterActionBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.actions) {
      SingleFilterAction.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FilterActionBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFilterActionBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.actions.push(SingleFilterAction.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FilterActionBody {
    return {
      actions: Array.isArray(object?.actions) ? object.actions.map((e: any) => SingleFilterAction.fromJSON(e)) : [],
    };
  },

  toJSON(message: FilterActionBody): unknown {
    const obj: any = {};
    if (message.actions) {
      obj.actions = message.actions.map((e) => e ? SingleFilterAction.toJSON(e) : undefined);
    } else {
      obj.actions = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<FilterActionBody>, I>>(base?: I): FilterActionBody {
    return FilterActionBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FilterActionBody>, I>>(object: I): FilterActionBody {
    const message = createBaseFilterActionBody();
    message.actions = object.actions?.map((e) => SingleFilterAction.fromPartial(e)) || [];
    return message;
  },
};

function createBaseFilterSerializedDataHeader(): FilterSerializedDataHeader {
  return {};
}

export const FilterSerializedDataHeader = {
  encode(_: FilterSerializedDataHeader, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FilterSerializedDataHeader {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFilterSerializedDataHeader();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): FilterSerializedDataHeader {
    return {};
  },

  toJSON(_: FilterSerializedDataHeader): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<FilterSerializedDataHeader>, I>>(base?: I): FilterSerializedDataHeader {
    return FilterSerializedDataHeader.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FilterSerializedDataHeader>, I>>(_: I): FilterSerializedDataHeader {
    const message = createBaseFilterSerializedDataHeader();
    return message;
  },
};

function createBaseFilterSerializedDataBody(): FilterSerializedDataBody {
  return { text: "" };
}

export const FilterSerializedDataBody = {
  encode(message: FilterSerializedDataBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.text !== "") {
      writer.uint32(10).string(message.text);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FilterSerializedDataBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFilterSerializedDataBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.text = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FilterSerializedDataBody {
    return { text: isSet(object.text) ? String(object.text) : "" };
  },

  toJSON(message: FilterSerializedDataBody): unknown {
    const obj: any = {};
    message.text !== undefined && (obj.text = message.text);
    return obj;
  },

  create<I extends Exact<DeepPartial<FilterSerializedDataBody>, I>>(base?: I): FilterSerializedDataBody {
    return FilterSerializedDataBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FilterSerializedDataBody>, I>>(object: I): FilterSerializedDataBody {
    const message = createBaseFilterSerializedDataBody();
    message.text = object.text ?? "";
    return message;
  },
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
