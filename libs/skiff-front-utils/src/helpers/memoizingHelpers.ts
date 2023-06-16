import type { FieldFunctionOptions, FieldReadFunction } from '@apollo/client';
import type { SafeReadonly } from '@apollo/client/cache/core/types/common';

/**
 * Memoize a FieldReadFunction for Apollo. This separate the read logic in two functions, the first (which should be lightweight) to get the dependencies of
 * the second (expensive) function which will be memoize (=> not called again if every deps match)
 * @param depsGetter Function called each time apollo needs the fields, this should be a lightweight function that returns the dependencies of the expensive valueGetter function
 * @param valueGetter Called with the arguments from the depsGetter function, should return the value for the field
 */
export const memoizeFieldReadFunction = <T, U extends Record<any, any>>(
  depsGetter: (existing: SafeReadonly<T> | undefined, options: FieldFunctionOptions) => U,
  valueGetter: (deps: U) => T | undefined
) => {
  const memoizeFieldReadFunction: FieldReadFunction<T> = (existing, options) => {
    const deps = depsGetter(existing, options);

    // We store everything in the storage object which is left by Apollo for this kind of operations
    const lastCallDeps = options.storage?.readFunctionMemoize?.deps;
    const lastCallResult = options.storage?.readFunctionMemoize?.result;
    if (lastCallDeps && lastCallResult) {
      // we use the fields in the current deps and last call deps to make sure we detect a change if returning less deps than last call
      const depsFields = new Set([...Object.keys(deps), ...Object.keys(lastCallDeps)]);
      if (Array.from(depsFields).every((field) => lastCallDeps[field] === deps[field])) {
        return lastCallResult;
      }
    }

    const result = valueGetter(deps);
    options.storage.readFunctionMemoize = {
      deps,
      result
    };
    return result;
  };

  return memoizeFieldReadFunction;
};
