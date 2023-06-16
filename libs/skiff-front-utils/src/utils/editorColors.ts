export enum EditorTextColorIds {
  PRIMARY = 'Primary',
  GRAY = 'Gray',
  PINK = 'Pink',
  ORANGE = 'Orange',
  YELLOW = 'Yellow',
  RED = 'Red',
  GREEN = 'Green',
  BLUE = 'Blue',
  DARK_BLUE = 'Dark blue'
}

export const TEXT_COLORS = {
  [EditorTextColorIds.PRIMARY]: 'var(--text-primary)',
  [EditorTextColorIds.GRAY]: 'var(--text-secondary)',
  [EditorTextColorIds.PINK]: 'var(--accent-pink-primary)',
  [EditorTextColorIds.ORANGE]: 'var(--accent-orange-primary)',
  [EditorTextColorIds.YELLOW]: 'var(--accent-yellow-primary)',
  [EditorTextColorIds.RED]: 'var(--accent-red-primary)',
  [EditorTextColorIds.GREEN]: 'var(--accent-green-primary)',
  [EditorTextColorIds.BLUE]: 'var(--accent-blue-primary)',
  [EditorTextColorIds.DARK_BLUE]: 'var(--accent-dark-blue-primary)'
};

export enum EditorHighlightColorIds {
  TRANSPARENT = 'No',
  GRAY = 'Gray',
  PINK = 'Pink',
  ORANGE = 'Orange',
  YELLOW = 'Yellow',
  RED = 'Red',
  GREEN = 'Green',
  BLUE = 'Blue',
  DARK_BLUE = 'Dark blue'
}
export const HIGHLIGHT_COLORS = {
  [EditorHighlightColorIds.TRANSPARENT]: 'var(--editor-highlight-transparent)',
  [EditorHighlightColorIds.GRAY]: 'var(--bg-cell-hover)',
  [EditorHighlightColorIds.PINK]: 'var(--accent-pink-secondary)',
  [EditorHighlightColorIds.ORANGE]: 'var(--accent-orange-secondary)',
  [EditorHighlightColorIds.RED]: 'var(--accent-red-secondary)',
  [EditorHighlightColorIds.YELLOW]: 'var(--accent-yellow-secondary)',
  [EditorHighlightColorIds.GREEN]: 'var(--accent-green-secondary)',
  [EditorHighlightColorIds.BLUE]: 'var(--accent-blue-secondary)',
  [EditorHighlightColorIds.DARK_BLUE]: 'var(--accent-dark-blue-secondary)'
};
