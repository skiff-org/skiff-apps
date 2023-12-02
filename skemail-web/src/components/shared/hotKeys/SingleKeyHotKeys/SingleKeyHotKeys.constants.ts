// NB: it's important for hot key actions to have unique values
// in case a single action has hot keys that span two or more single-key, single-combination and multi-combination hot keys
// considering that the handler wrapper handles single-key, single-combination and multi-combination hot keys differently
export enum SingleKeyActions {
  ARCHIVE = 'SINGLE_KEY_ARCHIVE',
  DOWN_ARROW = 'SINGLE_KEY_DOWN_ARROW',
  ENTER = 'SINGLE_KEY_ENTER',
  ESCAPE = 'SINGLE_KEY_ESCAPE',
  FORWARD = 'SINGLE_KEY_FORWARD',
  LABELS_MENU = 'SINGLE_KEY_LABELS_MENU',
  OPEN_COMPOSE = 'SINGLE_KEY_OPEN_COMPOSE',
  OPEN_COMMAND_PALETTE = 'SINGLE_KEY_OPEN_CMD_PALETTE',
  REPLY = 'SINGLE_KEY_REPLY',
  REPLY_ALL = 'SINGLE_KEY_REPLY_ALL',
  SELECT_THREAD = 'SINGLE_KEY_SELECT_THREAD',
  THREAD_FORMAT = 'SINGLE_KEY_THREAD_FORMAT',
  UNDO = 'SINGLE_KEY_UNDO',
  UP_ARROW = 'SINGLE_KEY_UP_ARROW'
}

/** Key map for sequences made up of a single key */
export const SINGLE_KEY_MAP = {
  // Archive thread
  [SingleKeyActions.ARCHIVE]: 'e',
  // Navigate mailbox threads
  [SingleKeyActions.DOWN_ARROW]: ['s', 'down'],
  // Open thread details
  [SingleKeyActions.ENTER]: 'Enter',
  // Collapse compose / close thread details
  [SingleKeyActions.ESCAPE]: 'Escape',
  // Forward the last email in the active thread
  [SingleKeyActions.FORWARD]: 'f',
  // Open the label dropdown
  [SingleKeyActions.LABELS_MENU]: 'l',
  // Open empty compose window
  [SingleKeyActions.OPEN_COMPOSE]: 'c',
  // Open command palette
  [SingleKeyActions.OPEN_COMMAND_PALETTE]: '/',
  // Reply to the last email in the active thread
  [SingleKeyActions.REPLY]: 'r',
  // Reply all to the last email in the active thread
  [SingleKeyActions.REPLY_ALL]: 'a',
  // Select thread
  [SingleKeyActions.SELECT_THREAD]: 'x',
  // Toggle thread format
  [SingleKeyActions.THREAD_FORMAT]: 't', // t for toggle
  // Undo trash / archive
  [SingleKeyActions.UNDO]: 'z',
  // Navigate mailbox threads
  [SingleKeyActions.UP_ARROW]: ['w', 'up']
};
