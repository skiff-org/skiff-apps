"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterFalsy = exports.filterExists = exports.ifMapHas = exports.assertUnreachable = exports.assert = exports.assertExists = void 0;
function assertExists(object, message = 'Is not defined') {
    if (object === undefined || object === null) {
        throw Error(message);
    }
}
exports.assertExists = assertExists;
function assert(condition, message = 'Assertion failed') {
    if (!condition) {
        throw Error(message);
    }
}
exports.assert = assert;
const assertUnreachable = (_object, message = 'Did not expect to get here') => {
    throw new Error(message);
};
exports.assertUnreachable = assertUnreachable;
/**
 * Type guard validate that a map has a key
 */
const ifMapHas = (map, key) => map.has(key);
exports.ifMapHas = ifMapHas;
// method useful in .filter to remove all null and undefined from an array and let Typescript know that the resulting array doesn't contain null or undefined
function filterExists(object) {
    return object !== null && object !== undefined;
}
exports.filterExists = filterExists;
// Same as filter exists but also removes all falsy values (Boolean(value) === true)
function filterFalsy(object) {
    return !!object;
}
exports.filterFalsy = filterFalsy;
//# sourceMappingURL=typeUtils.js.map