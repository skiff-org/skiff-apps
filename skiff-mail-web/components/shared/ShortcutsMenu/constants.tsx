import { Icon } from 'nightwatch-ui';
export interface ShortcutItem {
  icon?: Icon;
  name: string;
  shortcuts: Array<string>;
}
export interface ShortcutItemsSection {
  key: string;
  items: Array<ShortcutItem>;
}

export const ShortcutItems: Array<ShortcutItemsSection> = [
  {
    key: 'Mailbox',
    items: [
      {
        icon: Icon.ArrowDown,
        name: 'Move down',
        shortcuts: ['↓'] // array because there could be more than one shortcut
      },
      {
        icon: Icon.ArrowUp,
        name: 'Move up',
        shortcuts: ['↑']
      },
      {
        icon: Icon.CheckboxFilled,
        name: 'Select/unselect',
        shortcuts: ['X']
      },
      {
        icon: Icon.Archive,
        name: 'Archive',
        shortcuts: ['E']
      },
      {
        icon: Icon.Trash,
        name: 'Trash',
        shortcuts: ['#']
      },
      {
        icon: Icon.Undo,
        name: 'Undo trash/archive',
        shortcuts: ['Z']
      },
      {
        icon: Icon.EnvelopeRead,
        name: 'Open thread details',
        shortcuts: ['enter']
      },
      {
        icon: Icon.FullView,
        name: 'Full view',
        shortcuts: ['⌘+1']
      },
      {
        icon: Icon.SplitView,
        name: 'Split view',
        shortcuts: ['⌘+2']
      }
    ]
  },
  {
    key: 'Folders',
    items: [
      {
        icon: Icon.Inbox,
        name: 'Go to Inbox',
        shortcuts: ['g i']
      },
      {
        icon: Icon.Send,
        name: 'Go to Sent',
        shortcuts: ['g t']
      },
      {
        icon: Icon.File,
        name: 'Go to Drafts',
        shortcuts: ['g d']
      },
      {
        icon: Icon.Spam,
        name: 'Go to Spam',
        shortcuts: ['g !']
      },
      {
        icon: Icon.Archive,
        name: 'Go to Archive',
        shortcuts: ['g e']
      },
      {
        icon: Icon.Trash,
        name: 'Go to Trash',
        shortcuts: ['g #']
      }
    ]
  },
  {
    key: 'Compose',
    items: [
      {
        icon: Icon.Compose,
        name: 'Compose message',
        shortcuts: ['C']
      },
      {
        icon: Icon.Reply,
        name: 'Reply',
        shortcuts: ['R']
      },
      {
        icon: Icon.ReplyAll,
        name: 'Reply all',
        shortcuts: ['A']
      },
      {
        icon: Icon.ForwardEmail,
        name: 'Forward',
        shortcuts: ['F']
      },
      {
        icon: Icon.CollapseV,
        name: 'Collapse compose',
        shortcuts: ['esc']
      },
      {
        icon: Icon.Send,
        name: 'Send',
        shortcuts: ['⌘+enter']
      },
      {
        icon: Icon.Close,
        name: 'Discard draft',
        shortcuts: ['⌘+shift+,']
      },
      {
        icon: Icon.PaperClip,
        name: 'Add attachment',
        shortcuts: ['⌘+shift+A']
      },
      {
        name: 'Add recipient',
        icon: Icon.UserPlus,
        shortcuts: ['⌘+shift+O']
      },
      {
        name: 'Add CC recipient',
        icon: Icon.UserPlural,
        shortcuts: ['⌘+shift+C']
      },
      {
        name: 'Add BCC recipient',
        icon: Icon.EyeSlash,
        shortcuts: ['⌘+shift+B']
      },
      {
        name: 'Focus From field',
        icon: Icon.At,
        shortcuts: ['⌘+shift+F']
      },
      {
        name: 'Focus Message body',
        icon: Icon.Edit,
        shortcuts: ['⌘+shift+M']
      },
      {
        name: 'Focus Subject field',
        shortcuts: ['⌘+shift+S']
      },
      {
        name: 'Move from CC to BCC',
        icon: Icon.ArrowRight,
        shortcuts: ['⌘+shift+I']
      }
    ]
  },
  {
    key: 'Navigation',
    items: [
      {
        icon: Icon.Search,
        name: 'Command palette',
        shortcuts: ['/', '⌘+P']
      },
      {
        icon: Icon.QuestionCircle,
        name: 'Shortcuts',
        shortcuts: ['?']
      }
    ]
  },
  {
    key: 'Labels',
    items: [
      {
        icon: Icon.Tag,
        name: 'Add label',
        shortcuts: ['L']
      },
      {
        icon: Icon.Remove,
        name: 'Remove all labels',
        shortcuts: ['shift+Y']
      }
    ]
  }
];
