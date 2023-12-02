/* eslint-disable */
import Long from 'long';
import _m0 from 'protobufjs/minimal';

export const protobufPackage = 'com.skiff.calendar.encrypted';

export enum ConferenceProvider {
  Unknown = 0,
  Jitsi = 1,
  BraveTalk = 2,
  GoogleMeet = 3,
  Zoom = 4,
  MicrosoftTeams = 5,
  UNRECOGNIZED = -1
}

export function conferenceProviderFromJSON(object: any): ConferenceProvider {
  switch (object) {
    case 0:
    case 'Unknown':
      return ConferenceProvider.Unknown;
    case 1:
    case 'Jitsi':
      return ConferenceProvider.Jitsi;
    case 2:
    case 'BraveTalk':
      return ConferenceProvider.BraveTalk;
    case 3:
    case 'GoogleMeet':
      return ConferenceProvider.GoogleMeet;
    case 4:
    case 'Zoom':
      return ConferenceProvider.Zoom;
    case 5:
    case 'MicrosoftTeams':
      return ConferenceProvider.MicrosoftTeams;
    case -1:
    case 'UNRECOGNIZED':
    default:
      return ConferenceProvider.UNRECOGNIZED;
  }
}

export function conferenceProviderToJSON(object: ConferenceProvider): string {
  switch (object) {
    case ConferenceProvider.Unknown:
      return 'Unknown';
    case ConferenceProvider.Jitsi:
      return 'Jitsi';
    case ConferenceProvider.BraveTalk:
      return 'BraveTalk';
    case ConferenceProvider.GoogleMeet:
      return 'GoogleMeet';
    case ConferenceProvider.Zoom:
      return 'Zoom';
    case ConferenceProvider.MicrosoftTeams:
      return 'MicrosoftTeams';
    default:
      return 'UNKNOWN';
  }
}

export interface ExternalAttendee {
  id: string;
  type: string;
  attendeeStatus: string;
  permission: string;
  optional: boolean;
  email: string;
  deleted: boolean;
  updatedAt: number;
  displayName: string;
  isNew: boolean;
}

export interface Conference {
  provider: ConferenceProvider;
  link: string;
}

export interface EventHeader {}

export interface EventBody {
  title: string;
  description: string;
  location: string;
  lastUpdateKeyMap: { [key: string]: number };
  externalAttendees: ExternalAttendee[];
  isAllDay: boolean;
  conference?: Conference | undefined;
}

export interface EventBody_LastUpdateKeyMapEntry {
  key: string;
  value: number;
}

export interface CalendarEventPreferencesHeader {}

export interface CalendarEventPreferencesBody {
  color?: string | undefined;
  lastUpdateKeyMap: { [key: string]: number };
}

export interface CalendarEventPreferencesBody_LastUpdateKeyMapEntry {
  key: string;
  value: number;
}

function createBaseExternalAttendee(): ExternalAttendee {
  return {
    id: '',
    type: '',
    attendeeStatus: '',
    permission: '',
    optional: false,
    email: '',
    deleted: false,
    updatedAt: 0,
    displayName: '',
    isNew: false
  };
}

export const ExternalAttendee = {
  encode(message: ExternalAttendee, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== '') {
      writer.uint32(10).string(message.id);
    }
    if (message.type !== '') {
      writer.uint32(18).string(message.type);
    }
    if (message.attendeeStatus !== '') {
      writer.uint32(26).string(message.attendeeStatus);
    }
    if (message.permission !== '') {
      writer.uint32(34).string(message.permission);
    }
    if (message.optional === true) {
      writer.uint32(48).bool(message.optional);
    }
    if (message.email !== '') {
      writer.uint32(58).string(message.email);
    }
    if (message.deleted === true) {
      writer.uint32(64).bool(message.deleted);
    }
    if (message.updatedAt !== 0) {
      writer.uint32(72).int64(message.updatedAt);
    }
    if (message.displayName !== '') {
      writer.uint32(82).string(message.displayName);
    }
    if (message.isNew === true) {
      writer.uint32(88).bool(message.isNew);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ExternalAttendee {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseExternalAttendee();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.id = reader.string();
          break;
        case 2:
          message.type = reader.string();
          break;
        case 3:
          message.attendeeStatus = reader.string();
          break;
        case 4:
          message.permission = reader.string();
          break;
        case 6:
          message.optional = reader.bool();
          break;
        case 7:
          message.email = reader.string();
          break;
        case 8:
          message.deleted = reader.bool();
          break;
        case 9:
          message.updatedAt = longToNumber(reader.int64() as Long);
          break;
        case 10:
          message.displayName = reader.string();
          break;
        case 11:
          message.isNew = reader.bool();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ExternalAttendee {
    return {
      id: isSet(object.id) ? String(object.id) : '',
      type: isSet(object.type) ? String(object.type) : '',
      attendeeStatus: isSet(object.attendeeStatus) ? String(object.attendeeStatus) : '',
      permission: isSet(object.permission) ? String(object.permission) : '',
      optional: isSet(object.optional) ? Boolean(object.optional) : false,
      email: isSet(object.email) ? String(object.email) : '',
      deleted: isSet(object.deleted) ? Boolean(object.deleted) : false,
      updatedAt: isSet(object.updatedAt) ? Number(object.updatedAt) : 0,
      displayName: isSet(object.displayName) ? String(object.displayName) : '',
      isNew: isSet(object.isNew) ? Boolean(object.isNew) : false
    };
  },

  toJSON(message: ExternalAttendee): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    message.type !== undefined && (obj.type = message.type);
    message.attendeeStatus !== undefined && (obj.attendeeStatus = message.attendeeStatus);
    message.permission !== undefined && (obj.permission = message.permission);
    message.optional !== undefined && (obj.optional = message.optional);
    message.email !== undefined && (obj.email = message.email);
    message.deleted !== undefined && (obj.deleted = message.deleted);
    message.updatedAt !== undefined && (obj.updatedAt = Math.round(message.updatedAt));
    message.displayName !== undefined && (obj.displayName = message.displayName);
    message.isNew !== undefined && (obj.isNew = message.isNew);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ExternalAttendee>, I>>(object: I): ExternalAttendee {
    const message = createBaseExternalAttendee();
    message.id = object.id ?? '';
    message.type = object.type ?? '';
    message.attendeeStatus = object.attendeeStatus ?? '';
    message.permission = object.permission ?? '';
    message.optional = object.optional ?? false;
    message.email = object.email ?? '';
    message.deleted = object.deleted ?? false;
    message.updatedAt = object.updatedAt ?? 0;
    message.displayName = object.displayName ?? '';
    message.isNew = object.isNew ?? false;
    return message;
  }
};

function createBaseConference(): Conference {
  return { provider: 0, link: '' };
}

export const Conference = {
  encode(message: Conference, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.provider !== 0) {
      writer.uint32(8).int32(message.provider);
    }
    if (message.link !== '') {
      writer.uint32(18).string(message.link);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Conference {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConference();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.provider = reader.int32() as any;
          break;
        case 2:
          message.link = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Conference {
    return {
      provider: isSet(object.provider) ? conferenceProviderFromJSON(object.provider) : 0,
      link: isSet(object.link) ? String(object.link) : ''
    };
  },

  toJSON(message: Conference): unknown {
    const obj: any = {};
    message.provider !== undefined && (obj.provider = conferenceProviderToJSON(message.provider));
    message.link !== undefined && (obj.link = message.link);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Conference>, I>>(object: I): Conference {
    const message = createBaseConference();
    message.provider = object.provider ?? 0;
    message.link = object.link ?? '';
    return message;
  }
};

function createBaseEventHeader(): EventHeader {
  return {};
}

export const EventHeader = {
  encode(_: EventHeader, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventHeader {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventHeader();
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

  fromJSON(_: any): EventHeader {
    return {};
  },

  toJSON(_: EventHeader): unknown {
    const obj: any = {};
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<EventHeader>, I>>(_: I): EventHeader {
    const message = createBaseEventHeader();
    return message;
  }
};

function createBaseEventBody(): EventBody {
  return {
    title: '',
    description: '',
    location: '',
    lastUpdateKeyMap: {},
    externalAttendees: [],
    isAllDay: false,
    conference: undefined
  };
}

export const EventBody = {
  encode(message: EventBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.title !== '') {
      writer.uint32(10).string(message.title);
    }
    if (message.description !== '') {
      writer.uint32(26).string(message.description);
    }
    if (message.location !== '') {
      writer.uint32(34).string(message.location);
    }
    Object.entries(message.lastUpdateKeyMap).forEach(([key, value]) => {
      EventBody_LastUpdateKeyMapEntry.encode({ key: key as any, value }, writer.uint32(42).fork()).ldelim();
    });
    for (const v of message.externalAttendees) {
      ExternalAttendee.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    if (message.isAllDay === true) {
      writer.uint32(56).bool(message.isAllDay);
    }
    if (message.conference !== undefined) {
      Conference.encode(message.conference, writer.uint32(66).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventBody {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.title = reader.string();
          break;
        case 3:
          message.description = reader.string();
          break;
        case 4:
          message.location = reader.string();
          break;
        case 5:
          const entry5 = EventBody_LastUpdateKeyMapEntry.decode(reader, reader.uint32());
          if (entry5.value !== undefined) {
            message.lastUpdateKeyMap[entry5.key] = entry5.value;
          }
          break;
        case 6:
          message.externalAttendees.push(ExternalAttendee.decode(reader, reader.uint32()));
          break;
        case 7:
          message.isAllDay = reader.bool();
          break;
        case 8:
          message.conference = Conference.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): EventBody {
    return {
      title: isSet(object.title) ? String(object.title) : '',
      description: isSet(object.description) ? String(object.description) : '',
      location: isSet(object.location) ? String(object.location) : '',
      lastUpdateKeyMap: isObject(object.lastUpdateKeyMap)
        ? Object.entries(object.lastUpdateKeyMap).reduce<{ [key: string]: number }>((acc, [key, value]) => {
            acc[key] = Number(value);
            return acc;
          }, {})
        : {},
      externalAttendees: Array.isArray(object?.externalAttendees)
        ? object.externalAttendees.map((e: any) => ExternalAttendee.fromJSON(e))
        : [],
      isAllDay: isSet(object.isAllDay) ? Boolean(object.isAllDay) : false,
      conference: isSet(object.conference) ? Conference.fromJSON(object.conference) : undefined
    };
  },

  toJSON(message: EventBody): unknown {
    const obj: any = {};
    message.title !== undefined && (obj.title = message.title);
    message.description !== undefined && (obj.description = message.description);
    message.location !== undefined && (obj.location = message.location);
    obj.lastUpdateKeyMap = {};
    if (message.lastUpdateKeyMap) {
      Object.entries(message.lastUpdateKeyMap).forEach(([k, v]) => {
        obj.lastUpdateKeyMap[k] = Math.round(v);
      });
    }
    if (message.externalAttendees) {
      obj.externalAttendees = message.externalAttendees.map((e) => (e ? ExternalAttendee.toJSON(e) : undefined));
    } else {
      obj.externalAttendees = [];
    }
    message.isAllDay !== undefined && (obj.isAllDay = message.isAllDay);
    message.conference !== undefined &&
      (obj.conference = message.conference ? Conference.toJSON(message.conference) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<EventBody>, I>>(object: I): EventBody {
    const message = createBaseEventBody();
    message.title = object.title ?? '';
    message.description = object.description ?? '';
    message.location = object.location ?? '';
    message.lastUpdateKeyMap = Object.entries(object.lastUpdateKeyMap ?? {}).reduce<{ [key: string]: number }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = Number(value);
        }
        return acc;
      },
      {}
    );
    message.externalAttendees = object.externalAttendees?.map((e) => ExternalAttendee.fromPartial(e)) || [];
    message.isAllDay = object.isAllDay ?? false;
    message.conference =
      object.conference !== undefined && object.conference !== null
        ? Conference.fromPartial(object.conference)
        : undefined;
    return message;
  }
};

function createBaseEventBody_LastUpdateKeyMapEntry(): EventBody_LastUpdateKeyMapEntry {
  return { key: '', value: 0 };
}

export const EventBody_LastUpdateKeyMapEntry = {
  encode(message: EventBody_LastUpdateKeyMapEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== '') {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== 0) {
      writer.uint32(16).int64(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventBody_LastUpdateKeyMapEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventBody_LastUpdateKeyMapEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = reader.string();
          break;
        case 2:
          message.value = longToNumber(reader.int64() as Long);
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): EventBody_LastUpdateKeyMapEntry {
    return {
      key: isSet(object.key) ? String(object.key) : '',
      value: isSet(object.value) ? Number(object.value) : 0
    };
  },

  toJSON(message: EventBody_LastUpdateKeyMapEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined && (obj.value = Math.round(message.value));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<EventBody_LastUpdateKeyMapEntry>, I>>(
    object: I
  ): EventBody_LastUpdateKeyMapEntry {
    const message = createBaseEventBody_LastUpdateKeyMapEntry();
    message.key = object.key ?? '';
    message.value = object.value ?? 0;
    return message;
  }
};

function createBaseCalendarEventPreferencesHeader(): CalendarEventPreferencesHeader {
  return {};
}

export const CalendarEventPreferencesHeader = {
  encode(_: CalendarEventPreferencesHeader, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CalendarEventPreferencesHeader {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCalendarEventPreferencesHeader();
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

  fromJSON(_: any): CalendarEventPreferencesHeader {
    return {};
  },

  toJSON(_: CalendarEventPreferencesHeader): unknown {
    const obj: any = {};
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<CalendarEventPreferencesHeader>, I>>(_: I): CalendarEventPreferencesHeader {
    const message = createBaseCalendarEventPreferencesHeader();
    return message;
  }
};

function createBaseCalendarEventPreferencesBody(): CalendarEventPreferencesBody {
  return { color: undefined, lastUpdateKeyMap: {} };
}

export const CalendarEventPreferencesBody = {
  encode(message: CalendarEventPreferencesBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.color !== undefined) {
      writer.uint32(10).string(message.color);
    }
    Object.entries(message.lastUpdateKeyMap).forEach(([key, value]) => {
      CalendarEventPreferencesBody_LastUpdateKeyMapEntry.encode(
        { key: key as any, value },
        writer.uint32(18).fork()
      ).ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CalendarEventPreferencesBody {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCalendarEventPreferencesBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.color = reader.string();
          break;
        case 2:
          const entry2 = CalendarEventPreferencesBody_LastUpdateKeyMapEntry.decode(reader, reader.uint32());
          if (entry2.value !== undefined) {
            message.lastUpdateKeyMap[entry2.key] = entry2.value;
          }
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): CalendarEventPreferencesBody {
    return {
      color: isSet(object.color) ? String(object.color) : undefined,
      lastUpdateKeyMap: isObject(object.lastUpdateKeyMap)
        ? Object.entries(object.lastUpdateKeyMap).reduce<{ [key: string]: number }>((acc, [key, value]) => {
            acc[key] = Number(value);
            return acc;
          }, {})
        : {}
    };
  },

  toJSON(message: CalendarEventPreferencesBody): unknown {
    const obj: any = {};
    message.color !== undefined && (obj.color = message.color);
    obj.lastUpdateKeyMap = {};
    if (message.lastUpdateKeyMap) {
      Object.entries(message.lastUpdateKeyMap).forEach(([k, v]) => {
        obj.lastUpdateKeyMap[k] = Math.round(v);
      });
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<CalendarEventPreferencesBody>, I>>(object: I): CalendarEventPreferencesBody {
    const message = createBaseCalendarEventPreferencesBody();
    message.color = object.color ?? undefined;
    message.lastUpdateKeyMap = Object.entries(object.lastUpdateKeyMap ?? {}).reduce<{ [key: string]: number }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = Number(value);
        }
        return acc;
      },
      {}
    );
    return message;
  }
};

function createBaseCalendarEventPreferencesBody_LastUpdateKeyMapEntry(): CalendarEventPreferencesBody_LastUpdateKeyMapEntry {
  return { key: '', value: 0 };
}

export const CalendarEventPreferencesBody_LastUpdateKeyMapEntry = {
  encode(
    message: CalendarEventPreferencesBody_LastUpdateKeyMapEntry,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.key !== '') {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== 0) {
      writer.uint32(16).int64(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CalendarEventPreferencesBody_LastUpdateKeyMapEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCalendarEventPreferencesBody_LastUpdateKeyMapEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = reader.string();
          break;
        case 2:
          message.value = longToNumber(reader.int64() as Long);
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): CalendarEventPreferencesBody_LastUpdateKeyMapEntry {
    return {
      key: isSet(object.key) ? String(object.key) : '',
      value: isSet(object.value) ? Number(object.value) : 0
    };
  },

  toJSON(message: CalendarEventPreferencesBody_LastUpdateKeyMapEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined && (obj.value = Math.round(message.value));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<CalendarEventPreferencesBody_LastUpdateKeyMapEntry>, I>>(
    object: I
  ): CalendarEventPreferencesBody_LastUpdateKeyMapEntry {
    const message = createBaseCalendarEventPreferencesBody_LastUpdateKeyMapEntry();
    message.key = object.key ?? '';
    message.value = object.value ?? 0;
    return message;
  }
};

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var globalThis: any = (() => {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof self !== 'undefined') return self;
  if (typeof window !== 'undefined') return window;
  if (typeof global !== 'undefined') return global;
  throw 'Unable to locate global object';
})();

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

function longToNumber(long: Long): number {
  if (long.gt(Number.MAX_SAFE_INTEGER)) {
    throw new globalThis.Error('Value is larger than Number.MAX_SAFE_INTEGER');
  }
  return long.toNumber();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isObject(value: any): boolean {
  return typeof value === 'object' && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
