"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arrayInsert = exports.insertObjectIf = exports.insertIf = exports.upperCaseFirstLetter = exports.randomElem = exports.noop = exports.sleep = void 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
exports.sleep = sleep;
// no operation, used when a function is required but nothing should be done
const noop = () => { };
exports.noop = noop;
const randomElem = (arr) => arr[Math.floor(Math.random() * arr.length)];
exports.randomElem = randomElem;
const upperCaseFirstLetter = (s) => s && s[0].toUpperCase() + s.slice(1).toLowerCase();
exports.upperCaseFirstLetter = upperCaseFirstLetter;
const insertIf = (condition, ...elements) => (condition ? elements : []);
exports.insertIf = insertIf;
/** Use to conditionally insert object properties */
const insertObjectIf = (condition, object) => (condition ? object : {});
exports.insertObjectIf = insertObjectIf;
/**
 * Returns a copy of the given array with items inserted into the provided index.
 * @param array - initial array
 * @param index - index to insert items into
 * @param rest - items to be inserted into the array
 */
const arrayInsert = (array, index, ...rest) => {
    const arr = [...array];
    arr.splice(index, 0, ...rest);
    return arr;
};
exports.arrayInsert = arrayInsert;
//# sourceMappingURL=jsUtils.js.map