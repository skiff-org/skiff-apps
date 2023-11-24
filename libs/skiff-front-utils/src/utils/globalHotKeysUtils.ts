import { DROPDOWN_CALLER_ID } from 'nightwatch-ui';

/** Checks whether or not a dropdown is open on the screen */
export const isDropdownOpen = (e: KeyboardEvent) => !!(e.target as HTMLElement).querySelector(`#${DROPDOWN_CALLER_ID}`);

/** Checks whether or not an input field or a text field is in focus */
export const isInputFieldInFocus = (e: KeyboardEvent) =>
  ['input', 'select', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase());

export const onHandleHotKeyPress = (e?: KeyboardEvent) => {
  if (!e) return;
  e.preventDefault();
  e.stopImmediatePropagation();
};
