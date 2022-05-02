// eslint-disable-next-line import/prefer-default-export
export function assertExists<T>(object: T | undefined | null, message = 'Is not defined'): asserts object is T {
  if (object === undefined || object === null) {
    throw Error(message);
  }
}

// method useful in .filter to remove all null and undefined from an array and let Typescript know that the resulting array doesn't contain null or undefined
export function filterExists<T>(object: T | undefined | null): object is T {
  return object !== null && object !== undefined;
}

// Make only some keys optionnal in object
// Exemple: type test = {key1: string; key2: string}
// Optional<test, 'key1'> === {key1?: string; key2: string}
export type Optional<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
