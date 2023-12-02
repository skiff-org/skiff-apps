// NB: it's important for hot key actions to have unique values
// in case a single action has hot keys that span two or more single-key, single-combination and multi-combination hot keys
// considering that the handler wrapper handles single-key, single-combination and multi-combination hot keys differently
export enum MultiCombinationKeyActions {
  GO_TO_MAILBOX = 'MULTI_COMBINATION_GO_TO_MAILBOX'
}

/** Key map for sequences of multiple combinations (keys must be pressed and released one after another) */
export const MULTI_COMBINATION_KEY_MAP = {
  // Go to mailbox
  [MultiCombinationKeyActions.GO_TO_MAILBOX]: ['g i', 'g t', 'g d', 'g shift+1', 'g e', 'g shift+3']
};
