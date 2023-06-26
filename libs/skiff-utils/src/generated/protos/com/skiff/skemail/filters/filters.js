"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterSerializedDataBody = exports.FilterSerializedDataHeader = exports.FilterActionBody = exports.SingleFilterAction = exports.FilterActionHeader = exports.MailFilterBody = exports.MailFilterHeader = exports.protobufPackage = void 0;
const tslib_1 = require("tslib");
/* eslint-disable */
const minimal_1 = tslib_1.__importDefault(require("protobufjs/minimal"));
exports.protobufPackage = "com.skiff.skemail.filters";
function createBaseMailFilterHeader() {
    return {};
}
exports.MailFilterHeader = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    create(base) {
        return exports.MailFilterHeader.fromPartial(base ?? {});
    },
    fromPartial(_) {
        const message = createBaseMailFilterHeader();
        return message;
    },
};
function createBaseMailFilterBody() {
    return { filterType: "", filterField: undefined, serializedData: undefined, subFilter: [] };
}
exports.MailFilterBody = {
    encode(message, writer = minimal_1.default.Writer.create()) {
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
            exports.MailFilterBody.encode(v, writer.uint32(34).fork()).ldelim();
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
                    message.subFilter.push(exports.MailFilterBody.decode(reader, reader.uint32()));
                    continue;
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            filterType: isSet(object.filterType) ? String(object.filterType) : "",
            filterField: isSet(object.filterField) ? String(object.filterField) : undefined,
            serializedData: isSet(object.serializedData) ? String(object.serializedData) : undefined,
            subFilter: Array.isArray(object?.subFilter) ? object.subFilter.map((e) => exports.MailFilterBody.fromJSON(e)) : [],
        };
    },
    toJSON(message) {
        const obj = {};
        message.filterType !== undefined && (obj.filterType = message.filterType);
        message.filterField !== undefined && (obj.filterField = message.filterField);
        message.serializedData !== undefined && (obj.serializedData = message.serializedData);
        if (message.subFilter) {
            obj.subFilter = message.subFilter.map((e) => e ? exports.MailFilterBody.toJSON(e) : undefined);
        }
        else {
            obj.subFilter = [];
        }
        return obj;
    },
    create(base) {
        return exports.MailFilterBody.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseMailFilterBody();
        message.filterType = object.filterType ?? "";
        message.filterField = object.filterField ?? undefined;
        message.serializedData = object.serializedData ?? undefined;
        message.subFilter = object.subFilter?.map((e) => exports.MailFilterBody.fromPartial(e)) || [];
        return message;
    },
};
function createBaseFilterActionHeader() {
    return {};
}
exports.FilterActionHeader = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    create(base) {
        return exports.FilterActionHeader.fromPartial(base ?? {});
    },
    fromPartial(_) {
        const message = createBaseFilterActionHeader();
        return message;
    },
};
function createBaseSingleFilterAction() {
    return { actionType: "", serializedData: undefined };
}
exports.SingleFilterAction = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.actionType !== "") {
            writer.uint32(10).string(message.actionType);
        }
        if (message.serializedData !== undefined) {
            writer.uint32(18).string(message.serializedData);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(object) {
        return {
            actionType: isSet(object.actionType) ? String(object.actionType) : "",
            serializedData: isSet(object.serializedData) ? String(object.serializedData) : undefined,
        };
    },
    toJSON(message) {
        const obj = {};
        message.actionType !== undefined && (obj.actionType = message.actionType);
        message.serializedData !== undefined && (obj.serializedData = message.serializedData);
        return obj;
    },
    create(base) {
        return exports.SingleFilterAction.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseSingleFilterAction();
        message.actionType = object.actionType ?? "";
        message.serializedData = object.serializedData ?? undefined;
        return message;
    },
};
function createBaseFilterActionBody() {
    return { actions: [] };
}
exports.FilterActionBody = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        for (const v of message.actions) {
            exports.SingleFilterAction.encode(v, writer.uint32(10).fork()).ldelim();
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseFilterActionBody();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    if (tag !== 10) {
                        break;
                    }
                    message.actions.push(exports.SingleFilterAction.decode(reader, reader.uint32()));
                    continue;
            }
            if ((tag & 7) === 4 || tag === 0) {
                break;
            }
            reader.skipType(tag & 7);
        }
        return message;
    },
    fromJSON(object) {
        return {
            actions: Array.isArray(object?.actions) ? object.actions.map((e) => exports.SingleFilterAction.fromJSON(e)) : [],
        };
    },
    toJSON(message) {
        const obj = {};
        if (message.actions) {
            obj.actions = message.actions.map((e) => e ? exports.SingleFilterAction.toJSON(e) : undefined);
        }
        else {
            obj.actions = [];
        }
        return obj;
    },
    create(base) {
        return exports.FilterActionBody.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseFilterActionBody();
        message.actions = object.actions?.map((e) => exports.SingleFilterAction.fromPartial(e)) || [];
        return message;
    },
};
function createBaseFilterSerializedDataHeader() {
    return {};
}
exports.FilterSerializedDataHeader = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    create(base) {
        return exports.FilterSerializedDataHeader.fromPartial(base ?? {});
    },
    fromPartial(_) {
        const message = createBaseFilterSerializedDataHeader();
        return message;
    },
};
function createBaseFilterSerializedDataBody() {
    return { text: "" };
}
exports.FilterSerializedDataBody = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.text !== "") {
            writer.uint32(10).string(message.text);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : minimal_1.default.Reader.create(input);
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
    fromJSON(object) {
        return { text: isSet(object.text) ? String(object.text) : "" };
    },
    toJSON(message) {
        const obj = {};
        message.text !== undefined && (obj.text = message.text);
        return obj;
    },
    create(base) {
        return exports.FilterSerializedDataBody.fromPartial(base ?? {});
    },
    fromPartial(object) {
        const message = createBaseFilterSerializedDataBody();
        message.text = object.text ?? "";
        return message;
    },
};
function isSet(value) {
    return value !== null && value !== undefined;
}
//# sourceMappingURL=filters.js.map