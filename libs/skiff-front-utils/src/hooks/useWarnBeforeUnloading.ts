import { useEffect } from 'react';

/**
 * Attaches a listener that listens for when the user unloads the page
 * and triggers a warning modal to confirm unloading
 * @param shouldWarn - Should warn user before unloading
 * @param disabled - Disables the hook from attaching the listener
 */
const useWarnBeforeUnloading = (shouldWarn: boolean, disabled = false) => {
  useEffect(() => {
    if (disabled) return;

    const warnBeforeClosing = (e: BeforeUnloadEvent) => {
      if (!shouldWarn) return;

      // Docs state that preventDefault should now be used instead of returnValue,
      // but this is not yet supported by all browsers
      e.preventDefault();
      // Confirmation message customization is not longer supported by most modern browsers
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', warnBeforeClosing);
    return () => window.removeEventListener('beforeunload', warnBeforeClosing);
  }, [disabled, shouldWarn]);
};

export default useWarnBeforeUnloading;
