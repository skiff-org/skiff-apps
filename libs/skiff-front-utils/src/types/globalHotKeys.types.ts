/**
 * Type utils
 */
export type HotKeyHandlers<T> = { [action in keyof T]: (e: KeyboardEvent | undefined) => void };
