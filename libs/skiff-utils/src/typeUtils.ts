type NonNullable<T> = T extends null | undefined ? never : T;
type NonFalsy<T> = T extends null | undefined | false ? never : T;

export function assertExists<T>(object: T, message = 'Is not defined'): asserts object is NonNullable<T> {
  if (object === undefined || object === null) {
    throw Error(message);
  }
}

export function assert(condition: unknown, message = 'Assertion failed'): asserts condition {
  if (!condition) {
    throw Error(message);
  }
}

export const assertUnreachable = (object: never, message = 'Did not expect to get here'): never => {
  throw new Error(message);
};

// get the type of a promise
export type ValueType<T> = T extends Promise<infer U> ? U : T;

/**
 * Type guard validate that a map has a key
 */
export const ifMapHas = <K, V, P extends K>(map: Map<K, V>, key: P): map is { get(key: P): V } & typeof map =>
  map.has(key);

// method useful in .filter to remove all null and undefined from an array and let Typescript know that the resulting array doesn't contain null or undefined
export function filterExists<T>(object: T): object is NonNullable<T> {
  return object !== null && object !== undefined;
}

// Same as filter exists but also removes all falsy values (Boolean(value) === true)
export function filterTruthy<T>(object: T): object is NonFalsy<T> {
  return !!object;
}

// Make only some keys optional in object
// Exemple: type test = {key1: string; key2: string}
// Optional<test, 'key1'> === {key1?: string; key2: string}
export type Optional<T, K extends keyof T> = Partial<Pick<T, K>> & OmitStrict<T, K>;

// Opposite of Optional, mark some keys as required in an object
// https://stackoverflow.com/a/69328045
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

export type PartialExcept<T, Keys extends keyof T = keyof T> = Partial<T> & Pick<T, Keys>;

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

export type RecursivePartialExcept<T, Keys extends keyof T = keyof T> = RecursivePartial<T> & Pick<T, Keys>;

/**
 * Drop keys `K` from `T`, where `K` must exist in `T`.
 *
 * In other words, this is a stricter version of TypeScript's built-in `Omit` type.
 *
 * The implementation was copied from type-zoo:
 * @see https://github.com/pelotom/type-zoo/blob/eab30a98ab77612ae0a0e51b91456dcbf4b12257/types/index.d.ts#L33
 *
 * ...and type-zoo's implementation was based on the following GitHub comments:
 * @see https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-377567046
 * @see https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-378589263
 *
 * Note: The `extends any` conditional type may seem a bit odd, but it helps this
 * type work better with unions, as explained in the last GitHub comment above.
 */
export type OmitStrict<T, K extends keyof T> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends any ? Pick<T, Exclude<keyof T, K>> : never;
