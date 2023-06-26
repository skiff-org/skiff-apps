"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utf8BytesToString = exports.utf8StringToBytes = void 0;
const utf8StringToBytes = (data) => {
    const utf8encoder = new TextEncoder();
    return utf8encoder.encode(data);
};
exports.utf8StringToBytes = utf8StringToBytes;
const utf8BytesToString = (data) => {
    const utf8decoder = new TextDecoder();
    return utf8decoder.decode(data);
};
exports.utf8BytesToString = utf8BytesToString;
//# sourceMappingURL=utf8.js.map