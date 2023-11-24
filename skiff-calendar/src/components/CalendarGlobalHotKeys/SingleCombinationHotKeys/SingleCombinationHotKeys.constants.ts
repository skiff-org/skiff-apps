export enum SingleCombinationActions {
  OPEN_SETTINGS = 'SINGLE_COMBINATION_OPEN_SETTINGS'
}

/**
 * Key map for sequences of a single combination with multiple keys (keys must be pressed at the same time)
 * We use 'meta' for macs and 'ctrl' for windows
 */
export const SINGLE_COMBINATION_KEY_MAP = {
  [SingleCombinationActions.OPEN_SETTINGS]: ['meta+,', 'ctrl+,']
};
