// COMPOSE HOTKEYS ONLY FOR WHEN THE COMPOSE IS OPEN

export enum ComposeKeyActions {
  FOCUS_SHORTCUTS = 'FOCUS_SHORTCUTS',
  ATTACH = 'ATTACH',
  DISCARD_DRAFT = 'DISCARD_DRAFT',
  MOVE_CC_CONTACTS_TO_BCC = 'MOVE_CC_CONTACTS_TO_BCC',
  SEND = 'SEND'
}

// Key map for sequences of a single combination with multiple keys (keys must be pressed at the same time)
export const singleCombinationKeyMap = {
  [ComposeKeyActions.FOCUS_SHORTCUTS]: [
    // Focus the To field
    'meta+shift+o',
    // Focus the CC field
    'meta+shift+c',
    // Focus the BCC field
    'meta+shift+b',
    // Focus the Subject field
    'meta+shift+s',
    // Focus the From field
    'meta+shift+f',
    // Focus the message body editor
    'meta+shift+m'
  ],
  // Open the attachments file input popup
  [ComposeKeyActions.ATTACH]: 'meta+shift+a',
  // Close the compose and discard draft
  [ComposeKeyActions.DISCARD_DRAFT]: 'meta+shift+,',
  // Move all addresses from CC to BCC
  [ComposeKeyActions.MOVE_CC_CONTACTS_TO_BCC]: 'meta+shift+i',
  // Send email
  [ComposeKeyActions.SEND]: 'meta+enter'
};
