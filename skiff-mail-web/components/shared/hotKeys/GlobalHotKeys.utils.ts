import { DROPDOWN_CALLER_ID } from '@skiff-org/skiff-ui';

/** Checks whether or not a dropdown is open on the screen */
export const isDropdownOpen = (e: KeyboardEvent) => !!(e.target as HTMLElement).querySelector(`#${DROPDOWN_CALLER_ID}`);
