export enum GlobalKeyActions {
  OPEN_COMMAND_PALETTE = 'OPEN_COMMAND_PALETTE',
  OPEN_COMPOSE = 'OPEN_COMPOSE',
  ESCAPE = 'ESCAPE',
  UP_ARROW = 'UP_ARROW',
  DOWN_ARROW = 'DOWN_ARROW',
  ENTER = 'ENTER',
  CMD_1 = 'CMD_1',
  CMD_2 = 'CMD_2',
  SELECT_THREAD = 'SELECT_THREAD',
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
  OPEN_SHORTCUTS = 'OPEN_SHORTCUTS'
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
  [GlobalKeyActions.OPEN_COMMAND_PALETTE]: ['meta+p', 'ctrl+p'],
  [GlobalKeyActions.CMD_1]: 'meta+1',
  [GlobalKeyActions.CMD_2]: 'meta+2',
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

export enum ComposeKeyActions {
  TO = 'TO',
  CC = 'CC',
  BCC = 'BCC',
  FROM = 'FROM',
  EDIT_SUBJECT = 'EDIT_SUBJECT',
  EDIT_MESSAGE = 'EDIT_MESSAGE',
  ATTACH = 'ATTACH',
  DISCARD_DRAFT = 'DISCARD_DRAFT',
  MOVE_CONTACT_TO_BCC = 'MOVE_CONTACT_TO_BCC',
  SEND = 'SEND'
}

/**
 * Hot keys for the compose, only when its open
 */
export const composeKeyMap = {
  /**
   * Focus the To field
   */
  [ComposeKeyActions.TO]: ['meta+shift+O'],
  /**
   * Focus the CC field
   */
  [ComposeKeyActions.CC]: ['meta+shift+C'],
  /**
   * Focus the BCC field
   */
  [ComposeKeyActions.BCC]: ['meta+shift+B'],
  /**
   * Focus the From field
   */
  [ComposeKeyActions.FROM]: ['meta+shift+F'],
  /**
   * Focus the Subject field
   */
  [ComposeKeyActions.EDIT_SUBJECT]: ['meta+shift+S'],
  /**
   * Focus the Message body editor
   */
  [ComposeKeyActions.EDIT_MESSAGE]: ['meta+shift+M'],
  /**
   * Open the attachments file input popup
   */
  [ComposeKeyActions.ATTACH]: ['meta+shift+A'],
  /**
   * Close the compose and discard draft
   */
  [ComposeKeyActions.DISCARD_DRAFT]: ['meta+shift+,'],
  /**
   * Add all addresses from CC to BCC
   */
  [ComposeKeyActions.MOVE_CONTACT_TO_BCC]: ['meta+shift+I'],
  /**
   * Send email
   */
  [ComposeKeyActions.SEND]: ['meta+enter']
};

/**
 * Type utils
 */
export type HotKeyHandlers<T> = { [action in keyof T]: (e: KeyboardEvent | undefined) => void };
