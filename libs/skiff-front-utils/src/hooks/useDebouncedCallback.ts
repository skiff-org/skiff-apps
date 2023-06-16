import { useMemo, useRef } from 'react';

/**
 * Will call [callback] after [waitMs] of inactivity, if called while [callback] is still running
 * it will wait until it is resolved and then queue another call to [callback]
 * @param callback async function to debounce
 * @param waitMs debounce time
 * @returns debounced function
 */
export function useDebouncedAsyncCallback<T extends (...args: any) => Promise<any>>(
  callback: T,
  waitMs: number
): [
  (...args: Parameters<T>) => Promise<void>, // debounced function
  (...args: Parameters<T>) => Promise<void> // flush debounced => immediately invoke the debounced function
] {
  const callbackRef = useRef<T>(callback);
  callbackRef.current = callback;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // set to currently pending promise, used to queue another call if called when a function is already running
  const pendingPromise = useRef<Promise<any> | null>(null);

  const debouncedFunction = useMemo(
    () =>
      async (...args: Parameters<T>) => {
        if (pendingPromise.current) {
          try {
            await pendingPromise.current;
            // eslint-disable-next-line no-empty
          } catch {} // we don't care here if the previous promise rejected, it's already handled by the call
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(async () => {
          timeoutRef.current = null;
          try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            pendingPromise.current = callbackRef.current(...args);
            await pendingPromise.current;
          } finally {
            pendingPromise.current = null;
          }
        }, waitMs);
      },
    [waitMs]
  );

  const flush = useMemo(
    () =>
      async (...args: Parameters<T>) => {
        if (pendingPromise.current) {
          try {
            await pendingPromise.current;
            // eslint-disable-next-line no-empty
          } catch {} // we don't care here if the previous promise rejected, it's already handled by the call
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
          try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            pendingPromise.current = callbackRef.current(...args);
            await pendingPromise.current;
          } finally {
            pendingPromise.current = null;
          }
        }
      },
    []
  );

  return [debouncedFunction, flush];
}
