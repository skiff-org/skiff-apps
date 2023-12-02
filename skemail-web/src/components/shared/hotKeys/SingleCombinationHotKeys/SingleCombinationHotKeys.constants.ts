// NB: it's important for hot key actions to have unique values
// in case a single action has hot keys that span two or more single-key, single-combination and multi-combination hot keys
// considering that the handler wrapper handles single-key, single-combination and multi-combination hot keys differently
export enum SingleCombinationKeyActions {
  GO_TO_MAILBOX = 'SINGLE_COMBINATION_GO_TO_MAILBOX',
  OPEN_COMMAND_PALETTE = 'SINGLE_COMBINATION_OPEN_CMD_PALETTE',
  OPEN_SETTINGS = 'SINGLE_COMBINATION_OPEN_SETTINGS',
  REMOVE_ALL_LABELS = 'SINGLE_COMBINATION_REMOVE_ALL_LABELS',
  TRASH = 'SINGLE_COMBINATION_TRASH',
  MARK_SPAM = 'SINGLE_COMBINATION_MARK_SPAM'
}

/**
 * Key map for sequences of a single combination with multiple keys (keys must be pressed at the same time)
 * We use 'meta' for macs and 'ctrl' for windows
 */
export const SINGLE_COMBINATION_KEY_MAP = {
  // Go to mailbox
  [SingleCombinationKeyActions.GO_TO_MAILBOX]: ['g+i', 'g+t', 'g+d', 'g+shift+1', 'g+e', 'g+shift+3'],
  // Open command palette
  [SingleCombinationKeyActions.OPEN_COMMAND_PALETTE]: ['meta+p', 'ctrl+p', 'meta+k', 'ctrl+k'],
  // Open settings modal
  [SingleCombinationKeyActions.OPEN_SETTINGS]: ['meta+,', 'ctrl+,'],
  // Remove all user labels
  [SingleCombinationKeyActions.REMOVE_ALL_LABELS]: 'shift+y',
  // Trash selected / active threads
  [SingleCombinationKeyActions.TRASH]: 'shift+3', // #
  // Mark selected / active threads as spam
  [SingleCombinationKeyActions.MARK_SPAM]: 'shift+1'
};
