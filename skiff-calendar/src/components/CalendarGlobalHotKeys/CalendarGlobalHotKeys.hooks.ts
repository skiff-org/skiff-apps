import { isDropdownOpen, isInputFieldInFocus } from 'skiff-front-utils';

import { useAppSelector } from '../../utils';

export const useWrapActionHandler = (isSingleKeyHandler?: boolean) => {
  // Redux
  const { openModal } = useAppSelector((state) => state.modal);

  // Runs the global hot key handler if all hot key requirements pass
  const wrapActionHandler = (handler: (e: KeyboardEvent | undefined) => void) => (e: KeyboardEvent | undefined) => {
    // Ignore if
    if (
      // a dropdown is open / if an input field or text area is in focus
      (e && (isDropdownOpen(e) || isInputFieldInFocus(e))) ||
      // or if any other modal is open
      !!openModal
    )
      return;

    // For single-key handlers, ignore when meta or ctrl is pressed
    if (isSingleKeyHandler && e && (e.metaKey || e.ctrlKey)) return;

    handler(e);
  };

  return wrapActionHandler;
};
