import { useEffect, useRef, useState } from 'react';

/**
 * Rerender the current component every {ms}ms
 *
 * @param {number} ms - rerender interval value
 */
export default function useTimedRerender(ms: number, disable = false) {
  const interval = useRef<NodeJS.Timeout>();
  const [, setState] = useState(1);

  const clearTimer = () => {
    if (interval.current) {
      clearInterval(interval.current);
    }
  };

  useEffect(() => {
    clearTimer();
    if (!disable) {
      interval.current = setInterval(() => {
        setState((v) => v + 1);
      }, ms);
    }
    return clearTimer;
  }, [ms, disable]);
}
