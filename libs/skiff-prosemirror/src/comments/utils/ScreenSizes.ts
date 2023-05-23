import { useEffect, useState } from 'react';

import { CommentsPositionEmitter } from './FloatingThreads';

export enum ScreenSizes {
  Small = '0',
  Large = '1430' // 13.3 inches screen
}

export const getScreenSize = (): ScreenSizes => {
  const windowSize = window.innerWidth;
  let biggest = ScreenSizes.Small;
  for (const s in ScreenSizes) {
    if (+ScreenSizes[s] < windowSize && +ScreenSizes[s] > +biggest) biggest = ScreenSizes[s];
  }

  return biggest;
};

export const useScreenSize = (): ScreenSizes => {
  const [size, setSize] = useState<ScreenSizes>(ScreenSizes.Small);
  useEffect(() => {
    const listener = () => {
      const screenSize = getScreenSize();
      setSize(screenSize);
      CommentsPositionEmitter.emit('position-comments');
    };
    listener();
    window.addEventListener('resize', listener);
    return () => {
      window.removeEventListener('resize', listener);
    };
  }, []);
  return size;
};
