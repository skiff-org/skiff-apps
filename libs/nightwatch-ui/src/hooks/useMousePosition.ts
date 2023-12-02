import throttle from 'lodash/throttle';
import { useEffect, useState } from 'react';

// From https://gist.github.com/eldh/54954e01b40ef6fb812e2c8ee13731dc
// open sourced by Linear.app

/**
 * Mouse position as a tuple of [x, y]
 */
type MousePosition = [number, number];

/**
 * Hook to get the current mouse position
 * @returns Mouse position as a tuple of [x, y]
 */
export const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState<MousePosition>([0, 0]);

  const updateMousePosition = throttle((ev: MouseEvent) => {
    setMousePosition([ev.clientX, ev.clientY]);
  }, 200);

  useEffect(() => {
    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, [updateMousePosition]);

  return mousePosition;
};
