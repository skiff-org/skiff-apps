import * as React from 'react';

/**
 * @deprecated Not used internally. Use `MediaQueryListEvent` from lib.dom.d.ts instead.
 */
export interface MuiMediaQueryListEvent {
  matches: boolean;
}

/**
 * @deprecated Not used internally. Use `MediaQueryList` from lib.dom.d.ts instead.
 */
export interface MuiMediaQueryList {
  matches: boolean;
  addListener: (listener: MuiMediaQueryListListener) => void;
  removeListener: (listener: MuiMediaQueryListListener) => void;
}

/**
 * @deprecated Not used internally. Use `(event: MediaQueryListEvent) => void` instead.
 */
export type MuiMediaQueryListListener = (event: MuiMediaQueryListEvent) => void;

export interface UseMediaQueryOptions {
  /**
   * As `window.matchMedia()` is unavailable on the server,
   * it returns a default matches during the first mount.
   * @default false
   */
  defaultMatches?: boolean;
  /**
   * You can provide your own implementation of matchMedia.
   * This can be used for handling an iframe content window.
   */
  matchMedia?: typeof window.matchMedia;
  /**
   * To perform the server-side hydration, the hook needs to render twice.
   * A first time with `defaultMatches`, the value of the server, and a second time with the resolved value.
   * This double pass rendering cycle comes with a drawback: it's slower.
   * You can set this option to `true` if you use the returned value **only** client-side.
   * @default false
   */
  noSsr?: boolean;
  /**
   * You can provide your own implementation of `matchMedia`, it's used when rendering server-side.
   */
  ssrMatchMedia?: (query: string) => { matches: boolean };
}

// eslint-disable-next-line no-useless-concat -- Workaround for https://github.com/webpack/webpack/issues/14814
const maybeReactUseSyncExternalStore: undefined | any = (React as any)['useSyncExternalStore' + ''];

function useMediaQueryImplementation(
  query: string,
  defaultMatches: boolean,
  matchMedia: typeof window.matchMedia | null,
  ssrMatchMedia: ((query: string) => { matches: boolean }) | null,
  noSsr: boolean
): boolean {
  const getDefaultSnapshot = React.useMemo(() => defaultMatches, [defaultMatches]);

  const [snapshot, setSnapshot] = React.useState<boolean>(getDefaultSnapshot);

  React.useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (matchMedia !== null) {
      const mediaQueryList = matchMedia(query);
      setSnapshot(mediaQueryList.matches);

      const notify = () => setSnapshot(mediaQueryList.matches);

      // TODO: Use `addEventListener` once support for Safari < 14 is dropped
      mediaQueryList.addListener(notify);

      unsubscribe = () => {
        mediaQueryList.removeListener(notify);
      };
    }

    return unsubscribe;
  }, [matchMedia, query]);

  React.useEffect(() => {
    if (noSsr && ssrMatchMedia !== null) {
      const { matches } = ssrMatchMedia(query);
      setSnapshot(matches);
    }
  }, [noSsr, ssrMatchMedia, query]);

  return snapshot;
}
export default function useMediaQuery<Theme = unknown>(
  queryInput: string,
  options: UseMediaQueryOptions = {}
): boolean {
  // Wait for jsdom to support the match media feature.
  // This defensive check is here for simplicity.
  // Most of the time, the match media logic isn't central to people tests.
  const supportMatchMedia = typeof window !== 'undefined' && typeof window.matchMedia !== 'undefined';
  const {
    defaultMatches = false,
    matchMedia = supportMatchMedia ? window.matchMedia : null,
    ssrMatchMedia = null,
    noSsr = false
  } = options;

  const query = queryInput.replace(/^@media( ?)/m, '');
  const match =
    maybeReactUseSyncExternalStore !== undefined
      ? false
      : useMediaQueryImplementation(query, defaultMatches, matchMedia, ssrMatchMedia, noSsr);
  return match;
}
