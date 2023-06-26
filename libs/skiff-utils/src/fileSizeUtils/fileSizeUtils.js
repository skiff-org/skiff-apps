"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bytesToHumanReadable = exports.tbToGb = exports.gbToMb = exports.mbToKb = exports.gbToTb = exports.mbToGb = exports.kbToMb = exports.tbToBytes = exports.gbToBytes = exports.mbToBytes = exports.kbToBytes = exports.bytesToTb = exports.bytesToGb = exports.bytesToMb = exports.bytesToKb = exports.BYTE_SCALE_FACTOR = void 0;
/**
 * Scale factor to convert from each byte unit to the next
 * e.g. 1000 bytes = 1 kilobyte, 1000 kilobytes = 1 megabyte, etc.
 */
exports.BYTE_SCALE_FACTOR = 1000;
/**
 * Upward conversion functions from bytes
 */
const bytesToKb = (bytes) => bytes / exports.BYTE_SCALE_FACTOR;
exports.bytesToKb = bytesToKb;
const bytesToMb = (bytes) => (0, exports.bytesToKb)(bytes) / exports.BYTE_SCALE_FACTOR;
exports.bytesToMb = bytesToMb;
const bytesToGb = (bytes) => (0, exports.bytesToMb)(bytes) / exports.BYTE_SCALE_FACTOR;
exports.bytesToGb = bytesToGb;
const bytesToTb = (bytes) => (0, exports.bytesToGb)(bytes) / exports.BYTE_SCALE_FACTOR;
exports.bytesToTb = bytesToTb;
/**
 * Downward conversion functions to bytes
 */
const kbToBytes = (kb) => kb * exports.BYTE_SCALE_FACTOR;
exports.kbToBytes = kbToBytes;
const mbToBytes = (mb) => (0, exports.kbToBytes)(mb) * exports.BYTE_SCALE_FACTOR;
exports.mbToBytes = mbToBytes;
const gbToBytes = (gb) => (0, exports.mbToBytes)(gb) * exports.BYTE_SCALE_FACTOR;
exports.gbToBytes = gbToBytes;
const tbToBytes = (tb) => (0, exports.gbToBytes)(tb) * exports.BYTE_SCALE_FACTOR;
exports.tbToBytes = tbToBytes;
/**
 * Upward conversion functions between units
 */
const kbToMb = (kb) => kb / exports.BYTE_SCALE_FACTOR;
exports.kbToMb = kbToMb;
const mbToGb = (mb) => mb / exports.BYTE_SCALE_FACTOR;
exports.mbToGb = mbToGb;
const gbToTb = (gb) => gb / exports.BYTE_SCALE_FACTOR;
exports.gbToTb = gbToTb;
/**
 * Downward conversion functions between units
 */
const mbToKb = (mb) => mb * exports.BYTE_SCALE_FACTOR;
exports.mbToKb = mbToKb;
const gbToMb = (gb) => gb * exports.BYTE_SCALE_FACTOR;
exports.gbToMb = gbToMb;
const tbToGb = (tb) => tb * exports.BYTE_SCALE_FACTOR;
exports.tbToGb = tbToGb;
/**
 * Convert bytes to a human-readable string
 */
const bytesToHumanReadable = (bytes, decimalPlaces) => {
    // If bytes is less than 1 KB, we'll default to 1 KB instead of showing bytes
    if (!bytes) {
        return '0 KB';
    }
    // If bytes is less than 1 KB, we'll default to 1 KB instead of showing bytes
    if (bytes < exports.BYTE_SCALE_FACTOR) {
        return '1 KB';
    }
    if (bytes < (0, exports.mbToBytes)(1)) {
        // Since KB are our smallest display unit, we'll default rounding to 0 decimal places unless specified
        return `${(0, exports.bytesToKb)(bytes).toFixed(decimalPlaces ?? 0)} KB`;
    }
    if (bytes < (0, exports.gbToBytes)(1)) {
        return `${(0, exports.bytesToMb)(bytes).toFixed(decimalPlaces ?? 1)} MB`;
    }
    if (bytes < (0, exports.tbToBytes)(1)) {
        return `${(0, exports.bytesToGb)(bytes).toFixed(decimalPlaces ?? 1)} GB`;
    }
    return `${(0, exports.bytesToTb)(bytes).toFixed(decimalPlaces ?? 1)} TB`;
};
exports.bytesToHumanReadable = bytesToHumanReadable;
//# sourceMappingURL=fileSizeUtils.js.map