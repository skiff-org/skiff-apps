export enum Alignment {
  CENTER = 'center',
  INHERIT = 'inherit',
  JUSTIFY = 'justify',
  LEFT = 'left',
  RIGHT = 'right'
}

export enum FilledVariant {
  FILLED = 'filled',
  UNFILLED = 'unfilled'
}

export enum KeyboardEvents {
  KEY_DOWN = 'keydown',
  KEY_UP = 'keyup'
}

export enum Layout {
  INLINE = 'inline',
  STACKED = 'stacked'
}

export enum MouseEvents {
  CLICK = 'click',
  MOUSE_DOWN = 'mousedown',
  MOUSE_MOVE = 'mousemove',
  MOUSE_UP = 'mouseup'
}

export enum Size {
  X_SMALL = 'xsmall',
  SMALL = 'small',
  MEDIUM = 'medium',
  X_MEDIUM = 'xmedium',
  LARGE = 'large',
  X_LARGE = 'xlarge'
}

export enum StorageOnlyThemeMode {
  SYSTEM = 'system'
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark'
}

export enum TouchEvents {
  TOUCH_START = 'touchstart'
}

export enum Type {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary',
  DESTRUCTIVE = 'destructive'
}

export type MouseClickEvents = MouseEvents.CLICK | MouseEvents.MOUSE_DOWN | MouseEvents.MOUSE_UP;
export type LocalStorageThemeMode = ThemeMode | StorageOnlyThemeMode;
