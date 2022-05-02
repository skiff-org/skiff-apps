import { RefObject, useEffect } from 'react';

/**
 * calls the handler when there is click outside the ref
 * @param ref container reference
 * @param handler click handler function
 * @param excludedClasses
 */
export function useOnClickOutside(
  ref: RefObject<HTMLElement>,
  handler: (event: MouseEvent) => void,
  excludedClasses?: string[]
) {
  useEffect(() => {
    const listener: EventListener = (event: any) => {
      // excluded classes
      if (excludedClasses) {
        for (let i = 0; i < excludedClasses.length; i++) {
          if (event.target.closest(`.${excludedClasses[i]}`)) return;
        }
      }
      // Do nothing if clicking ref's element or descendent elements
      if (!ref || !ref.current || ref.current.contains(event.target)) {
        return;
      }

      if (handler) handler(event);
    };
    document.addEventListener('mouseup', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mouseup', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, excludedClasses]);
}
