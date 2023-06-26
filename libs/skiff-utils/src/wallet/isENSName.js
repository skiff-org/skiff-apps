"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isENSName = void 0;
/**
 * Check if supplied string is a valid ENS name
 * @param ensName
 * @returns true if the given ensName ends with .eth
 */
function isENSName(ensName) {
    if (!ensName)
        return false;
    return ensName.endsWith('.eth');
}
exports.isENSName = isENSName;
//# sourceMappingURL=isENSName.js.map