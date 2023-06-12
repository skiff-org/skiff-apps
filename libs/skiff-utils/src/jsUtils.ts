export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// no operation, used when a function is required but nothing should be done
export const noop = () => {};

export const randomElem = <T>(arr: Array<T>) => arr[Math.floor(Math.random() * arr.length)];

export const upperCaseFirstLetter = (s: string) => s && s[0].toUpperCase() + s.slice(1).toLowerCase();

export const insertIf = <T>(condition: boolean, ...elements: T[]): T[] => (condition ? elements : []);

/** Use to conditionally insert object properties */
export const insertObjectIf = (condition: boolean, object: object): object => (condition ? object : {});

/**
 * Returns a copy of the given array with items inserted into the provided index.
 * @param array - initial array
 * @param index - index to insert items into
 * @param rest - items to be inserted into the array
 */
export const arrayInsert = <T>(array: T[], index: number, ...rest: T[]): T[] => {
  const arr = [...array];
  arr.splice(index, 0, ...rest);
  return arr;
};
