export enum GlobalKeyActions {
  OPEN_COMMAND_PALETTE = 'OPEN_COMMAND_PALETTE',
  OPEN_COMPOSE = 'OPEN_COMPOSE',
  ESCAPE = 'ESCAPE',
  UP_ARROW = 'UP_ARROW',
  DOWN_ARROW = 'DOWN_ARROW',
  ENTER = 'ENTER',
  SELECT_THREAD = 'SELECT_THREAD',
  THREAD_FORMAT = 'THREAD_FORMAT',
  ARCHIVE = 'ARCHIVE',
  TRASH = 'TRASH',
  UNDO = 'UNDO',
  GO_TO_MAILBOX = 'GO_TO_MAILBOX',
  ACTIVE_THREAD = 'ACTIVE_THREAD',
  REPLY_ALL = 'REPLY_ALL',
  REPLY = 'REPLY',
  FORWARD = 'FORWARD',
  LABELS_MENU = 'LABELS_MENU',
  REMOVE_ALL_LABELS = 'REMOVE_ALL_LABELS',
  OPEN_SHORTCUTS = 'OPEN_SHORTCUTS',
  OPEN_SETTINGS = 'OPEN_SETTINGS'
}

// Key combinations vs sequences: https://github.com/greena13/react-hotkeys/blob/master/README.md#key-combinations-vs-sequences
// Key map for sequences made up of a single key
// meta+P does not work on Windows because it is a system command
export const globalSingleKeyMap = {
  [GlobalKeyActions.OPEN_COMMAND_PALETTE]: ['/'],
  [GlobalKeyActions.OPEN_COMPOSE]: 'c',
  [GlobalKeyActions.ESCAPE]: 'Escape',
  [GlobalKeyActions.UP_ARROW]: ['w', 'up'],
  [GlobalKeyActions.DOWN_ARROW]: ['s', 'down'],
  [GlobalKeyActions.ENTER]: ['Enter'],
  [GlobalKeyActions.SELECT_THREAD]: 'x',
  [GlobalKeyActions.THREAD_FORMAT]: 't',  // 't' for toggle
  [GlobalKeyActions.ARCHIVE]: 'e',
  [GlobalKeyActions.UNDO]: 'z',
  /**
   * reply all to the last email in the active thread
   * */
  [GlobalKeyActions.REPLY_ALL]: 'a',
  /**
   * reply to the last email in the active thread
   * */
  [GlobalKeyActions.REPLY]: 'r',
  /**
   * forward the last email in the active thread
   * */
  [GlobalKeyActions.FORWARD]: 'f',
  /**
   * add or remove label
   * */
  [GlobalKeyActions.LABELS_MENU]: 'l'
};

// Key map for sequences of a single combination with multiple keys (keys must be pressed at the same time)
export const globalSingleCombinationKeyMap = {
  [GlobalKeyActions.OPEN_COMMAND_PALETTE]: ['meta+p', 'ctrl+p', 'meta+k', 'ctrl+k'],
  [GlobalKeyActions.OPEN_SETTINGS]: ['meta+,', 'ctrl+,'],
  [GlobalKeyActions.TRASH]: 'shift+3', // #
  /**
   * remove all labels
   * */
  [GlobalKeyActions.REMOVE_ALL_LABELS]: 'shift+y',
  /**
   * open shortcuts menu
   * */
  [GlobalKeyActions.OPEN_SHORTCUTS]: 'shift+/'
};

// Key map for sequences of multiple combinations (keys must be pressed and released one after another)
export const globalMultiCombinationKeyMap = {
  [GlobalKeyActions.GO_TO_MAILBOX]: ['g i', 'g t', 'g d', 'g shift+1', 'g e', 'g shift+3']
};

/**
 * Type utils
 */
export type HotKeyHandlers<T> = { [action in keyof T]: (e: KeyboardEvent | undefined) => void };
