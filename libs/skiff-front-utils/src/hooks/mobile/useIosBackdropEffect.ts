import { useEffect, useRef } from 'react';

// This hook can be added to any drawer in the app that need to have the backdeop effect,
// will listen to changes on the hight of the drawer by paperId and will change the main container transform accordingly
export const useIosBackdropEffect = (isDrawerOpen: boolean, bodyPaperId: string, drawerPaperId: string) => {
  const paperRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const getPaperCache = () => {
    if (!paperRef.current || !paperRef.current.isConnected) {
      paperRef.current = document.getElementById(drawerPaperId) as HTMLDivElement;
    }
    return paperRef.current;
  };

  const getBackdropCache = () => {
    if (!backdropRef.current || !backdropRef.current.isConnected) {
      backdropRef.current = document.getElementById(bodyPaperId) as HTMLDivElement;
    }
    return backdropRef.current;
  };

  useEffect(() => {
    const onDrawerMove = () => {
      const transformY = parseFloat(getPaperCache().style.transform.replace('translate(0px, ', '').replace('px)', ''));
      if (isNaN(transformY)) {
        return;
      }
      const progress = transformY / (window.screen.height - 150);
      const backdrop = getBackdropCache();
      backdrop.style.transform = `scale(calc(0.9 + ${progress * 0.1}))`;
      backdrop.style.transition = 'none';
    };
    const onDrawerMoveEnd = () => {
      const backdrop = getBackdropCache();
      backdrop.style.transform = 'scale(0.9)';
      backdrop.style.opacity = '0.68';
      backdrop.style.borderRadius = '16px 16px 0px 0px';
      backdrop.style.overflow = 'hidden';
      backdrop.style.transition = 'transform 0.2s cubic-bezier(0.3, 0, 0.5, 0.3)';
    };
    const removeEvents = () => {
      if (!getBackdropCache()) return;

      getBackdropCache().style.transform = `scale(1)`;
      getBackdropCache().style.opacity = '1.0';
      getBackdropCache().style.transition = 'transform 0.2s cubic-bezier(0.3, 0, 0.5, 0.3)';
      getBackdropCache().style.borderRadius = 'unset';
      getBackdropCache().style.overflow = 'unset';

      window.document.removeEventListener('touchmove', onDrawerMove);
      window.document.removeEventListener('touchend', onDrawerMoveEnd);
    };
    if (!isDrawerOpen) {
      return removeEvents;
    }
    getBackdropCache().style.transform = `scale(0.9)`;
    getBackdropCache().style.opacity = '0.68';
    getBackdropCache().style.transition = 'transform 0.2s cubic-bezier(0.3, 0, 0.5, 0.3)';
    getBackdropCache().style.borderRadius = '16px 16px 0px 0px';
    getBackdropCache().style.overflow = 'hidden';

    window.document.addEventListener('touchmove', onDrawerMove);
    window.document.addEventListener('touchend', onDrawerMoveEnd);
    return removeEvents;
  }, [isDrawerOpen]);
};
