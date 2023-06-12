/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// Memoize a parameter-less function depending on the result of the depGetter function
export const memoizeOnDeps = <T>(depGetter: () => any, func: () => T) => {
  let memoizationState = null as null | {
    dependency: any;
    result: T;
  };

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
