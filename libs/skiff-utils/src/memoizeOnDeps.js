"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoizeOnDeps = void 0;
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// Memoize a parameter-less function depending on the result of the depGetter function
const memoizeOnDeps = (depGetter, func) => {
    let memoizationState = null;
    return () => {
        const dependency = depGetter();
        if (memoizationState && dependency === memoizationState.dependency) {
            return memoizationState.result;
        }
        const result = func();
        memoizationState = {
            dependency,
            result
        };
        return result;
    };
};
exports.memoizeOnDeps = memoizeOnDeps;
//# sourceMappingURL=memoizeOnDeps.js.map