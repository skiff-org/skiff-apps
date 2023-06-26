"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptedData = exports.Address = exports.RawMimeBody = exports.RawMimeHeader = exports.AttachmentBody = exports.AttachmentHeader = exports.MailTextAsHTMLBody = exports.MailTextAsHTMLHeader = exports.MailTextBody = exports.MailTextHeader = exports.MailHTMLBody = exports.MailHTMLHeader = exports.MailSubjectBody = exports.MailSubjectHeader = exports.AttachmentMetadataBody = exports.AttachmentMetadataHeader = exports.protobufPackage = void 0;
const tslib_1 = require("tslib");
/* eslint-disable */
const long_1 = tslib_1.__importDefault(require("long"));
const minimal_1 = tslib_1.__importDefault(require("protobufjs/minimal"));
exports.protobufPackage = 'com.skiff.skemail.encrypted';
function createBaseAttachmentMetadataHeader() {
    return {};
}
exports.AttachmentMetadataHeader = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : new minimal_1.default.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseAttachmentMetadataHeader();
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    fromPartial(_) {
        const message = createBaseAttachmentMetadataHeader();
        return message;
    }
};
function createBaseAttachmentMetadataBody() {
    return { contentType: '', contentDisposition: '', filename: '', checksum: '', size: 0, contentId: '' };
}
exports.AttachmentMetadataBody = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.contentType !== '') {
            writer.uint32(10).string(message.contentType);
        }
        if (message.contentDisposition !== '') {
            writer.uint32(18).string(message.contentDisposition);
        }
        if (message.filename !== '') {
            writer.uint32(26).string(message.filename);
        }
        if (message.checksum !== '') {
            writer.uint32(42).string(message.checksum);
        }
        if (message.size !== 0) {
            writer.uint32(48).int64(message.size);
        }
        if (message.contentId !== '') {
            writer.uint32(58).string(message.contentId);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : new minimal_1.default.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseAttachmentMetadataBody();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.contentType = reader.string();
                    break;
                case 2:
                    message.contentDisposition = reader.string();
                    break;
                case 3:
                    message.filename = reader.string();
                    break;
                case 5:
                    message.checksum = reader.string();
                    break;
                case 6:
                    message.size = longToNumber(reader.int64());
                    break;
                case 7:
                    message.contentId = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },
    fromJSON(object) {
        return {
            contentType: isSet(object.contentType) ? String(object.contentType) : '',
            contentDisposition: isSet(object.contentDisposition) ? String(object.contentDisposition) : '',
            filename: isSet(object.filename) ? String(object.filename) : '',
            checksum: isSet(object.checksum) ? String(object.checksum) : '',
            size: isSet(object.size) ? Number(object.size) : 0,
            contentId: isSet(object.contentId) ? String(object.contentId) : ''
        };
    },
    toJSON(message) {
        const obj = {};
        message.contentType !== undefined && (obj.contentType = message.contentType);
        message.contentDisposition !== undefined && (obj.contentDisposition = message.contentDisposition);
        message.filename !== undefined && (obj.filename = message.filename);
        message.checksum !== undefined && (obj.checksum = message.checksum);
        message.size !== undefined && (obj.size = Math.round(message.size));
        message.contentId !== undefined && (obj.contentId = message.contentId);
        return obj;
    },
    fromPartial(object) {
        const message = createBaseAttachmentMetadataBody();
        message.contentType = object.contentType ?? '';
        message.contentDisposition = object.contentDisposition ?? '';
        message.filename = object.filename ?? '';
        message.checksum = object.checksum ?? '';
        message.size = object.size ?? 0;
        message.contentId = object.contentId ?? '';
        return message;
    }
};
function createBaseMailSubjectHeader() {
    return {};
}
exports.MailSubjectHeader = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : new minimal_1.default.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseMailSubjectHeader();
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    fromPartial(_) {
        const message = createBaseMailSubjectHeader();
        return message;
    }
};
function createBaseMailSubjectBody() {
    return { subject: '' };
}
exports.MailSubjectBody = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.subject !== '') {
            writer.uint32(10).string(message.subject);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : new minimal_1.default.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseMailSubjectBody();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.subject = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },
    fromJSON(object) {
        return {
            subject: isSet(object.subject) ? String(object.subject) : ''
        };
    },
    toJSON(message) {
        const obj = {};
        message.subject !== undefined && (obj.subject = message.subject);
        return obj;
    },
    fromPartial(object) {
        const message = createBaseMailSubjectBody();
        message.subject = object.subject ?? '';
        return message;
    }
};
function createBaseMailHTMLHeader() {
    return {};
}
exports.MailHTMLHeader = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : new minimal_1.default.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseMailHTMLHeader();
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    fromPartial(_) {
        const message = createBaseMailHTMLHeader();
        return message;
    }
};
function createBaseMailHTMLBody() {
    return { html: '' };
}
exports.MailHTMLBody = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.html !== '') {
            writer.uint32(10).string(message.html);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : new minimal_1.default.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseMailHTMLBody();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.html = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },
    fromJSON(object) {
        return {
            html: isSet(object.html) ? String(object.html) : ''
        };
    },
    toJSON(message) {
        const obj = {};
        message.html !== undefined && (obj.html = message.html);
        return obj;
    },
    fromPartial(object) {
        const message = createBaseMailHTMLBody();
        message.html = object.html ?? '';
        return message;
    }
};
function createBaseMailTextHeader() {
    return {};
}
exports.MailTextHeader = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : new minimal_1.default.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseMailTextHeader();
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    fromPartial(_) {
        const message = createBaseMailTextHeader();
        return message;
    }
};
function createBaseMailTextBody() {
    return { text: '' };
}
exports.MailTextBody = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.text !== '') {
            writer.uint32(10).string(message.text);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : new minimal_1.default.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseMailTextBody();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.text = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },
    fromJSON(object) {
        return {
            text: isSet(object.text) ? String(object.text) : ''
        };
    },
    toJSON(message) {
        const obj = {};
        message.text !== undefined && (obj.text = message.text);
        return obj;
    },
    fromPartial(object) {
        const message = createBaseMailTextBody();
        message.text = object.text ?? '';
        return message;
    }
};
function createBaseMailTextAsHTMLHeader() {
    return {};
}
exports.MailTextAsHTMLHeader = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : new minimal_1.default.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseMailTextAsHTMLHeader();
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    fromPartial(_) {
        const message = createBaseMailTextAsHTMLHeader();
        return message;
    }
};
function createBaseMailTextAsHTMLBody() {
    return { textAsHTML: '' };
}
exports.MailTextAsHTMLBody = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.textAsHTML !== '') {
            writer.uint32(10).string(message.textAsHTML);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : new minimal_1.default.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseMailTextAsHTMLBody();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.textAsHTML = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },
    fromJSON(object) {
        return {
            textAsHTML: isSet(object.textAsHTML) ? String(object.textAsHTML) : ''
        };
    },
    toJSON(message) {
        const obj = {};
        message.textAsHTML !== undefined && (obj.textAsHTML = message.textAsHTML);
        return obj;
    },
    fromPartial(object) {
        const message = createBaseMailTextAsHTMLBody();
        message.textAsHTML = object.textAsHTML ?? '';
        return message;
    }
};
function createBaseAttachmentHeader() {
    return {};
}
exports.AttachmentHeader = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : new minimal_1.default.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseAttachmentHeader();
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    fromPartial(_) {
        const message = createBaseAttachmentHeader();
        return message;
    }
};
function createBaseAttachmentBody() {
    return { content: '' };
}
exports.AttachmentBody = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.content !== '') {
            writer.uint32(10).string(message.content);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : new minimal_1.default.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseAttachmentBody();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.content = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },
    fromJSON(object) {
        return {
            content: isSet(object.content) ? String(object.content) : ''
        };
    },
    toJSON(message) {
        const obj = {};
        message.content !== undefined && (obj.content = message.content);
        return obj;
    },
    fromPartial(object) {
        const message = createBaseAttachmentBody();
        message.content = object.content ?? '';
        return message;
    }
};
function createBaseRawMimeHeader() {
    return {};
}
exports.RawMimeHeader = {
    encode(_, writer = minimal_1.default.Writer.create()) {
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : new minimal_1.default.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseRawMimeHeader();
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
    fromJSON(_) {
        return {};
    },
    toJSON(_) {
        const obj = {};
        return obj;
    },
    fromPartial(_) {
        const message = createBaseRawMimeHeader();
        return message;
    }
};
function createBaseRawMimeBody() {
    return { rawMime: '' };
}
exports.RawMimeBody = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.rawMime !== '') {
            writer.uint32(10).string(message.rawMime);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : new minimal_1.default.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseRawMimeBody();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.rawMime = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },
    fromJSON(object) {
        return {
            rawMime: isSet(object.rawMime) ? String(object.rawMime) : ''
        };
    },
    toJSON(message) {
        const obj = {};
        message.rawMime !== undefined && (obj.rawMime = message.rawMime);
        return obj;
    },
    fromPartial(object) {
        const message = createBaseRawMimeBody();
        message.rawMime = object.rawMime ?? '';
        return message;
    }
};
function createBaseAddress() {
    return { name: '', address: '' };
}
exports.Address = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.name !== '') {
            writer.uint32(10).string(message.name);
        }
        if (message.address !== '') {
            writer.uint32(18).string(message.address);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : new minimal_1.default.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseAddress();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.name = reader.string();
                    break;
                case 2:
                    message.address = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },
    fromJSON(object) {
        return {
            name: isSet(object.name) ? String(object.name) : '',
            address: isSet(object.address) ? String(object.address) : ''
        };
    },
    toJSON(message) {
        const obj = {};
        message.name !== undefined && (obj.name = message.name);
        message.address !== undefined && (obj.address = message.address);
        return obj;
    },
    fromPartial(object) {
        const message = createBaseAddress();
        message.name = object.name ?? '';
        message.address = object.address ?? '';
        return message;
    }
};
function createBaseEncryptedData() {
    return {
        encryptedSubject: '',
        encryptedHtml: '',
        encryptedText: '',
        encryptedTextAsHtml: '',
        encryptedTextSnippet: ''
    };
}
exports.EncryptedData = {
    encode(message, writer = minimal_1.default.Writer.create()) {
        if (message.encryptedSubject !== '') {
            writer.uint32(10).string(message.encryptedSubject);
        }
        if (message.encryptedHtml !== '') {
            writer.uint32(18).string(message.encryptedHtml);
        }
        if (message.encryptedText !== '') {
            writer.uint32(26).string(message.encryptedText);
        }
        if (message.encryptedTextAsHtml !== '') {
            writer.uint32(34).string(message.encryptedTextAsHtml);
        }
        if (message.encryptedTextSnippet !== '') {
            writer.uint32(42).string(message.encryptedTextSnippet);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof minimal_1.default.Reader ? input : new minimal_1.default.Reader(input);
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = createBaseEncryptedData();
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.encryptedSubject = reader.string();
                    break;
                case 2:
                    message.encryptedHtml = reader.string();
                    break;
                case 3:
                    message.encryptedText = reader.string();
                    break;
                case 4:
                    message.encryptedTextAsHtml = reader.string();
                    break;
                case 5:
                    message.encryptedTextSnippet = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },
    fromJSON(object) {
        return {
            encryptedSubject: isSet(object.encryptedSubject) ? String(object.encryptedSubject) : '',
            encryptedHtml: isSet(object.encryptedHtml) ? String(object.encryptedHtml) : '',
            encryptedText: isSet(object.encryptedText) ? String(object.encryptedText) : '',
            encryptedTextAsHtml: isSet(object.encryptedTextAsHtml) ? String(object.encryptedTextAsHtml) : '',
            encryptedTextSnippet: isSet(object.encryptedTextSnippet) ? String(object.encryptedTextSnippet) : ''
        };
    },
    toJSON(message) {
        const obj = {};
        message.encryptedSubject !== undefined && (obj.encryptedSubject = message.encryptedSubject);
        message.encryptedHtml !== undefined && (obj.encryptedHtml = message.encryptedHtml);
        message.encryptedText !== undefined && (obj.encryptedText = message.encryptedText);
        message.encryptedTextAsHtml !== undefined && (obj.encryptedTextAsHtml = message.encryptedTextAsHtml);
        message.encryptedTextSnippet !== undefined && (obj.encryptedTextSnippet = message.encryptedTextSnippet);
        return obj;
    },
    fromPartial(object) {
        const message = createBaseEncryptedData();
        message.encryptedSubject = object.encryptedSubject ?? '';
        message.encryptedHtml = object.encryptedHtml ?? '';
        message.encryptedText = object.encryptedText ?? '';
        message.encryptedTextAsHtml = object.encryptedTextAsHtml ?? '';
        message.encryptedTextSnippet = object.encryptedTextSnippet ?? '';
        return message;
    }
};
var globalThis = (() => {
    if (typeof globalThis !== 'undefined')
        return globalThis;
    if (typeof self !== 'undefined')
        return self;
    if (typeof window !== 'undefined')
        return window;
    if (typeof global !== 'undefined')
        return global;
    throw 'Unable to locate global object';
})();
function longToNumber(long) {
    if (long.gt(Number.MAX_SAFE_INTEGER)) {
        throw new globalThis.Error('Value is larger than Number.MAX_SAFE_INTEGER');
    }
    return long.toNumber();
}
if (minimal_1.default.util.Long !== long_1.default) {
    minimal_1.default.util.Long = long_1.default;
    minimal_1.default.configure();
}
function isSet(value) {
    return value !== null && value !== undefined;
}
//# sourceMappingURL=encrypted_data.js.map