import { memoize } from 'lodash';

// Return a date memoized from a string, useful when returning date in apollo cache to make sure it doesn't trigger a rerender because
// Date cannot be compared by identify even when constructed from the same source string
export const parseAsMemoizedDate = memoize((date: string) => date && new Date(date));
