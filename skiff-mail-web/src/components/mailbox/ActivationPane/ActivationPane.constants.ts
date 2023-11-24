export interface ShortcutItem {
  name: string;
  // Array because there could be more than one shortcut
  shortcuts: Array<string>;
}
export interface ShortcutItemsSection {
  key: string;
  items: Array<ShortcutItem>;
}

export const SHORTCUT_ITEMS: Array<ShortcutItemsSection> = [
  {
    key: 'Mailbox',
    items: [
      {
        name: 'Move down',
        shortcuts: ['↓']
      },
      {
        name: 'Move up',
        shortcuts: ['↑']
      },
      {
        name: 'Select/unselect',
        shortcuts: ['X']
      },
      {
        name: 'Archive',
        shortcuts: ['E']
      },
      {
        name: 'Trash',
        shortcuts: ['#']
      },
      {
        name: 'Undo trash/archive',
        shortcuts: ['Z']
      },
      {
        name: 'Open thread details',
        shortcuts: ['enter']
      }
    ]
  },
  {
    key: 'Folders',
    items: [
      {
        name: 'Go to Inbox',
        shortcuts: ['G+I', 'G I']
      },
      {
        name: 'Go to Sent',
        shortcuts: ['G+T', 'G T']
      },
      {
        name: 'Go to Drafts',
        shortcuts: ['G+D', 'G D']
      },
      {
        name: 'Go to Spam',
        shortcuts: ['G+!', 'G !']
      },
      {
        name: 'Go to Archive',
        shortcuts: ['G+E', 'G E']
      },
      {
        name: 'Go to Trash',
        shortcuts: ['G+#', 'G #']
      }
    ]
  },
  {
    key: 'Compose',
    items: [
      {
        name: 'Compose message',
        shortcuts: ['C']
      },
      {
        name: 'Reply',
        shortcuts: ['R']
      },
      {
        name: 'Reply all',
        shortcuts: ['A']
      },
      {
        name: 'Forward',
        shortcuts: ['F']
      },
      {
        name: 'Collapse compose',
        shortcuts: ['esc']
      },
      {
        name: 'Send',
        shortcuts: ['⌘+enter']
      },
      {
        name: 'Discard draft',
        shortcuts: ['⌘+shift+,']
      },
      {
        name: 'Add attachment',
        shortcuts: ['⌘+shift+A']
      },
      {
        name: 'Add recipient',
        shortcuts: ['⌘+shift+O']
      },
      {
        name: 'Add CC recipient',
        shortcuts: ['⌘+shift+C']
      },
      {
        name: 'Add BCC recipient',
        shortcuts: ['⌘+shift+B']
      },
      {
        name: 'Focus From field',
        shortcuts: ['⌘+shift+F']
      },
      {
        name: 'Focus Message body',
        shortcuts: ['⌘+shift+M']
      },
      {
        name: 'Focus Subject field',
        shortcuts: ['⌘+shift+S']
      },
      {
        name: 'Move from CC to BCC',
        shortcuts: ['⌘+shift+I']
      }
    ]
  },
  {
    key: 'Navigation',
    items: [
      {
        name: 'Command palette',
        shortcuts: ['/', '⌘+P', '⌘+K']
      },
      {
        name: 'Settings',
        shortcuts: ['⌘+,']
      }
    ]
  },
  {
    key: 'Labels',
    items: [
      {
        name: 'Add label',
        shortcuts: ['L']
      },
      {
        name: 'Remove all labels',
        shortcuts: ['shift+Y']
      }
    ]
  }
];
