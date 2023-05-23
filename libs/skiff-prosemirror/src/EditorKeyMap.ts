import browser from './browser';
import { Keymap } from './createEditorKeyMap';
// https://tinyurl.com/ybwf3wex
export function tooltip(keymap?: Keymap | null): string | null {
  if (keymap) {
    let shortcut;

    if (browser.isMac()) {
      shortcut = keymap.mac.replace(/Cmd/i, '⌘').replace(/Shift/i, '⇧').replace(/Ctrl/i, '^').replace(/Alt/i, '⌥');
    } else {
      shortcut = keymap.windows;
    }

    return `${keymap.description} (${shortcut})`;
  }

  return null;
}
export function findKeymapByDescription(description: string): Keymap | null | undefined {
  const matches = ALL_KEYS.filter((keymap) => keymap.description?.toUpperCase() === description.toUpperCase());
  return matches[0];
}
export function findShortcutByDescription(description: string): string | null | undefined {
  const keymap = findKeymapByDescription(description);

  if (keymap) {
    return findShortcutByKeymap(keymap);
  }

  return null;
}
export function findShortcutByKeymap(keymap: Keymap): string | null | undefined {
  if (browser.isMac()) {
    return keymap.mac;
  }

  return keymap.windows;
}
export function makeKeyMap(description: string, windows: string, mac: string, common?: string | null): Keymap {
  return {
    description,
    windows,
    mac,
    common
  };
}
export function makeKeyMapWithCommon(description: string, common: string): Keymap {
  const windows = common.replace(/Mod/i, 'Ctrl');
  const mac = common.replace(/Mod/i, 'Cmd');
  return makeKeyMap(description, windows, mac, common);
}
export const KEY_BACK_DELETE = makeKeyMapWithCommon('', 'Backspace');
export const KEY_FORWARD_DELETE = makeKeyMapWithCommon('', 'Delete');
export const KEY_INSERT_HORIZONTAL_RULE = makeKeyMapWithCommon('Insert horizontal rule', 'Mod-Shift--');
export const KEY_INSERT_NEW_LINE = makeKeyMapWithCommon('Insert new line', 'Shift-Enter');
export const KEY_INSERT_NEW_LINE_IN_BLOCKQUOTE = makeKeyMapWithCommon('Insert new line in blockquote', 'Shift-Enter');
export const KEY_INSERT_NEW_LINE_IN_LIST_ITEM = makeKeyMapWithCommon('Insert new line in list item', 'Shift-Enter');
export const KEY_REDO = makeKeyMapWithCommon('Redo', 'Mod-Shift-z');
export const KEY_SET_NORMAL_TEXT = makeKeyMap('Normal text', 'Ctrl-0', 'Cmd-Alt-0');
export const KEY_SHIFT_BACKSPACE = makeKeyMapWithCommon('Shift Backspace', 'Shift-Backspace');
export const KEY_SPLIT_CODEBLOCK = makeKeyMapWithCommon('Split code block', 'Enter');
export const KEY_SPLIT_LIST_ITEM = makeKeyMapWithCommon('Split list item', 'Enter');
export const KEY_TAB = makeKeyMapWithCommon('', 'Tab');
export const KEY_TAB_SHIFT = makeKeyMapWithCommon('', 'Shift-Tab');
export const KEY_TOGGLE_BLOCK_QUOTE = makeKeyMap('Block quote', 'Ctrl-7', 'Cmd-Alt-7');
export const KEY_TOGGLE_BOLD = makeKeyMapWithCommon('Toggle bold', 'Mod-b');
export const KEY_TOGGLE_BULLET_LIST = makeKeyMapWithCommon('Toggle bullet list', 'Mod-Shift-b');
export const KEY_TOGGLE_CODE_BLOCK = makeKeyMap('Code block', 'Ctrl-8', 'Cmd-Alt-8');
export const KEY_TOGGLE_HEADING_1 = makeKeyMap('Heading 1', 'Ctrl-1', 'Cmd-Alt-1');
export const KEY_TOGGLE_HEADING_2 = makeKeyMap('Heading 2', 'Ctrl-2', 'Cmd-Alt-2');
export const KEY_TOGGLE_HEADING_3 = makeKeyMap('Heading 3', 'Ctrl-3', 'Cmd-Alt-3');
export const KEY_TOGGLE_HEADING_4 = makeKeyMap('Heading 4', 'Ctrl-4', 'Cmd-Alt-4');
export const KEY_TOGGLE_HEADING_5 = makeKeyMap('Heading 5', 'Ctrl-5', 'Cmd-Alt-5');
export const KEY_TOGGLE_HEADING_6 = makeKeyMap('Heading 5', 'Ctrl-6', 'Cmd-Alt-6');
export const KEY_TOGGLE_ITALIC = makeKeyMapWithCommon('Toggle italic', 'Mod-i');
export const KEY_TOGGLE_MONOSPACE = makeKeyMapWithCommon('Toggle monospace', 'Mod-Shift-m');
export const KEY_TOGGLE_ORDERED_LIST = makeKeyMapWithCommon('Toggle ordered list', 'Cmd-Shift-l');
export const KEY_TOGGLE_STRIKETHROUGH = makeKeyMapWithCommon('Toggle strikethrough', 'Mod-Shift-s');
export const KEY_TOGGLE_UNDERLINE = makeKeyMapWithCommon('Toggle underline', 'Mod-u');
export const KEY_EM_DASH = makeKeyMapWithCommon('Em dash', 'Mod-Alt--');
export const KEY_EN_DASH = makeKeyMapWithCommon('En dash', 'Alt--');
export const KEY_UNDO = makeKeyMapWithCommon('Undo', 'Mod-z');
export const KEY_TOGGLE_LINK = makeKeyMapWithCommon('Toggle link', 'Cmd-k');
export const KEY_INDENT_MORE = makeKeyMapWithCommon('Indent more', 'Mod-]');
export const KEY_INDENT_LESS = makeKeyMapWithCommon('Indent less', 'Mod-[');

export const ALL_KEYS = [
  KEY_BACK_DELETE,
  KEY_FORWARD_DELETE,
  KEY_INSERT_HORIZONTAL_RULE,
  KEY_INSERT_NEW_LINE,
  KEY_INSERT_NEW_LINE_IN_BLOCKQUOTE,
  KEY_INSERT_NEW_LINE_IN_LIST_ITEM,
  KEY_SET_NORMAL_TEXT,
  KEY_SHIFT_BACKSPACE,
  KEY_SPLIT_LIST_ITEM,
  KEY_TAB_SHIFT,
  KEY_TAB,
  KEY_TOGGLE_BLOCK_QUOTE,
  KEY_TOGGLE_BOLD,
  KEY_TOGGLE_BULLET_LIST,
  KEY_TOGGLE_BULLET_LIST,
  KEY_TOGGLE_CODE_BLOCK,
  KEY_TOGGLE_HEADING_1,
  KEY_TOGGLE_HEADING_2,
  KEY_TOGGLE_HEADING_3,
  KEY_TOGGLE_HEADING_4,
  KEY_TOGGLE_HEADING_5,
  KEY_TOGGLE_HEADING_6,
  KEY_TOGGLE_ITALIC,
  KEY_TOGGLE_MONOSPACE,
  KEY_TOGGLE_ORDERED_LIST,
  KEY_TOGGLE_STRIKETHROUGH,
  KEY_TOGGLE_UNDERLINE,
  KEY_EM_DASH,
  KEY_EN_DASH,
  KEY_UNDO,
  KEY_TOGGLE_LINK,
  KEY_INDENT_MORE,
  KEY_INDENT_LESS
];
