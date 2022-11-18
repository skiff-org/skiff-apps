import { RefObject, useEffect, useState } from 'react';

export default function useTouchYDistance(ref: RefObject<HTMLElement>) {
  const [distance, setDistance] = useState(0);
  let startY = 0;
  let currentY = 0;

  const onTouchStart = (e: TouchEvent) => {
    if (window.TouchEvent && e instanceof TouchEvent) {
      startY = e.touches[0].pageY;
    }
    currentY = startY;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (window.TouchEvent && e instanceof TouchEvent) {
      currentY = e.touches[0].pageY;
      setDistance(currentY - startY);
    }
  };

  const onEnd = () => {
    startY = 0;
    currentY = 0;
  };

  useEffect(() => {
    if (!ref.current) return;
    ref.current.addEventListener('touchstart', onTouchStart, { passive: true });
    ref.current.addEventListener('touchmove', onTouchMove, { passive: true });
    ref.current.addEventListener('touchend', onEnd);
    return () => {
      if (!ref.current) return;
      ref.current.removeEventListener('touchstart', onTouchStart);
      ref.current.removeEventListener('touchmove', onTouchMove);
      ref.current.removeEventListener('touchend', onEnd);
    };
  }, []);

  return distance;
}
