export const SURFACE_CLASSNAME = 'surface';
export const TOAST_CLASSNAME = 'toast';
export const DROPDOWN_CALLER_CLASSNAME = 'dropdown-caller';
export const MODAL_CLASSNAME = 'modal';
export const DRAWER_CLASSNAME = 'drawer';
export const SCRIM_CLASSNAME = 'scrim';
export const MOBILE_AVOID_KEYBOARD_CLASSNAME = 'mobile-avoiding-keyboard';
export const OPTION_MENU_CLASSNAME = 'optionMenu';
export const ENABLE_OUTSIDE_CLICKS_CLASSNAME = 'enable-outside-clicks';
export const CONFIRM_MODAL_CLASSNAME = 'confirm-modal';
export const MUI_DIALOG_ROOT_CLASSNAME = 'MuiDialog-root';
export const MUI_AUTOCOMPLETE_POPPER_CLASSNAME = 'MuiAutocomplete-popper';
export const MUI_DIALOG_CONTENT_ROOT_CLASSNAME = 'MuiDialogContent-root';

export const MODAL_AND_DROPDOWN_SELECTOR = `.${MODAL_CLASSNAME}, .${OPTION_MENU_CLASSNAME}, .${MUI_DIALOG_CONTENT_ROOT_CLASSNAME}`;

// offclicks on these classes are (almost) always ignored; dropdown option menus are an exception, see useClickOutside.ts
export const ALWAYS_IGNORED_OFFCLICK_CLASSES = [
  DROPDOWN_CALLER_CLASSNAME,
  TOAST_CLASSNAME,
  SURFACE_CLASSNAME,
  MODAL_CLASSNAME,
  MUI_DIALOG_ROOT_CLASSNAME,
  MUI_AUTOCOMPLETE_POPPER_CLASSNAME
];

// transition time in ms
export const SURFACE_ENTRANCE_EXIT_TRANSITION_TIME = 200;

// Minimum gap between an option menu and constraining edges
export const DROPDOWN_GAP = 16;
