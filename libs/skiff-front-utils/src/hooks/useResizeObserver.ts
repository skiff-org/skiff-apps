import { useRef, useCallback } from 'react';

/**
 * Observes resizings of an element to which the ref callback is passed, and calls specified handler.
 */

const useResizeObserver = (onResize: (entries: ResizeObserverEntry[]) => void) => {
  // store a ref to the resizeObserver so that we can disconnect it easily
  const categoryObserverRef = useRef<ResizeObserver | null>(null);
  if (!categoryObserverRef.current) {
    categoryObserverRef.current = new ResizeObserver(onResize);
  }

  // use a callback for the ref;
  // useEffect unreliable to watch for ref changes because ref is decoupled from component lifecycle
  const refForObservedElement = useCallback((node: HTMLDivElement | null) => {
    const observer = categoryObserverRef.current;
    if (!observer) return;
    if (node !== null) {
      observer.observe(node, { box: 'border-box' });
    } else {
      observer.disconnect();
    }
  }, []);

  return { refForObservedElement };
};

export default useResizeObserver;
