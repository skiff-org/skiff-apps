import { mathBackspaceCmd } from '@benrbray/prosemirror-math';
import {
  baseKeymap,
  chainCommands,
  Command,
  createParagraphNear,
  deleteSelection,
  joinBackward,
  liftEmptyBlock,
  newlineInCode,
  selectNodeBackward,
  splitBlockKeepMarks
} from 'prosemirror-commands';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { redo, undo } from 'y-prosemirror';

import browser from './browser';
import { deleteListItem } from './commands/deleteListItem';
import { enterFromTitle } from './commands/enterFromTitle';
import * as EditorCommands from './EditorCommands';
import * as EditorKeyMap from './EditorKeyMap';
import { insertNewLine } from './InsertNewLine';
import { splitToggleItemOrEnterContent } from './toggleList/keymap';
import UICommand from './ui/UICommand';

export interface Keymap {
  mac: string;
  windows: string;
  common: string | undefined | null;
  description: string;
}

/**
 * when hitting tab/shift-tab and the editor is not handling the command the focus is moved to the next Keyboard-navigable element.
 * we want to prevent that to avoid loosing focus from the editor so we return true to tell the editor we handled the command
 */
const preventBrowseFocusChangeOnTabCommands = () => true;

type UserKeyCommand = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView | null) => boolean;
type UserKeyMap = Record<string, UserKeyCommand>;
const {
  KEY_BACK_DELETE,
  KEY_FORWARD_DELETE,
  KEY_REDO,
  KEY_TAB_SHIFT,
  KEY_TAB,
  KEY_TOGGLE_BOLD,
  KEY_TOGGLE_ITALIC,
  KEY_TOGGLE_UNDERLINE,
  KEY_UNDO,
  KEY_TOGGLE_LINK,
  KEY_EM_DASH,
  KEY_EN_DASH,
  KEY_INDENT_MORE,
  KEY_INDENT_LESS,
  KEY_TOGGLE_HEADING_1,
  KEY_TOGGLE_HEADING_2,
  KEY_TOGGLE_HEADING_3,
  KEY_SET_NORMAL_TEXT,
  KEY_TOGGLE_CODE_BLOCK,
  KEY_TOGGLE_STRIKETHROUGH,
  KEY_SPLIT_LIST_ITEM,
  KEY_INSERT_NEW_LINE
} = EditorKeyMap;
const {
  BLOCKQUOTE_INSERT_NEW_LINE,
  EM,
  INDENT_LESS,
  INDENT_MORE,
  LIST_ITEM_INSERT_NEW_LINE,
  LIST_ITEM_MERGE_DOWN,
  TABLE_MOVE_TO_NEXT_CELL,
  TABLE_MOVE_TO_PREV_CELL,
  TEXT_INSERT_TAB_SPACE,
  TEXT_REMOVE_TAB_SPACE,
  STRONG,
  UNDERLINE,
  LINK_SET_URL,
  EM_DASH,
  EN_DASH,
  H1,
  H2,
  H3,
  PARAGRAPH_COMMAND,
  CODE,
  STRIKE,
  LIST_SPLIT,
  LIFT_DOWN_TOGGLE_ITEM,
  INDENT_TOGGLE_ITEM_MORE,
  INDENT_TOGGLE_ITEM_LESS,
  JUMP_OVER_SUBPAGE_DOWN,
  JUMP_OVER_SUBPAGE_UP
} = EditorCommands;

export function bindCommands(...commands: Array<UICommand | Command>): UserKeyCommand {
  return function (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView | null): boolean {
    return commands.some((cmd) => {
      if (cmd instanceof UICommand && cmd.isEnabled(state, view)) {
        return cmd.execute(state, dispatch, view);
      } else if (cmd instanceof Function) {
        return cmd(state, dispatch, view || undefined);
      }
      return false;
    });
  };
}

const getKeymapToOS = (keymap: Keymap): string => {
  if (keymap.common) return keymap.common;
  return browser.isMac() ? keymap.mac : keymap.windows;
};

export default function createEditorKeyMap(): UserKeyMap {
  const result = {
    [KEY_BACK_DELETE.common!]: bindCommands(
      deleteListItem,
      JUMP_OVER_SUBPAGE_UP,
      chainCommands(deleteSelection, mathBackspaceCmd, joinBackward, selectNodeBackward)
    ),
    [KEY_FORWARD_DELETE.common!]: bindCommands(LIFT_DOWN_TOGGLE_ITEM, LIST_ITEM_MERGE_DOWN, JUMP_OVER_SUBPAGE_DOWN),
    [KEY_SPLIT_LIST_ITEM.common!]: LIST_SPLIT.execute,
    [KEY_TAB.common!]: bindCommands(
      INDENT_TOGGLE_ITEM_MORE,
      TABLE_MOVE_TO_NEXT_CELL,
      TEXT_INSERT_TAB_SPACE,
      INDENT_MORE,
      preventBrowseFocusChangeOnTabCommands
    ),
    [KEY_TAB_SHIFT.common!]: bindCommands(
      INDENT_TOGGLE_ITEM_LESS,
      TABLE_MOVE_TO_PREV_CELL,
      TEXT_REMOVE_TAB_SPACE,
      INDENT_LESS,
      preventBrowseFocusChangeOnTabCommands
    ),
    [KEY_TOGGLE_BOLD.common!]: STRONG.execute,
    [KEY_TOGGLE_ITALIC.common!]: EM.execute,
    [KEY_TOGGLE_UNDERLINE.common!]: UNDERLINE.execute,
    [getKeymapToOS(KEY_TOGGLE_HEADING_1)]: H1.execute,
    [getKeymapToOS(KEY_TOGGLE_HEADING_2)]: H2.execute,
    [getKeymapToOS(KEY_TOGGLE_HEADING_3)]: H3.execute,
    [getKeymapToOS(KEY_SET_NORMAL_TEXT)]: PARAGRAPH_COMMAND.execute,
    [KEY_TOGGLE_STRIKETHROUGH.common!]: STRIKE.execute,
    // history
    [KEY_UNDO.common!]: undo,
    [KEY_REDO.common!]: redo,
    [KEY_INSERT_NEW_LINE.common!]: bindCommands(
      BLOCKQUOTE_INSERT_NEW_LINE,
      LIST_ITEM_INSERT_NEW_LINE,
      splitToggleItemOrEnterContent(true),
      insertNewLine
    ),
    [KEY_TOGGLE_LINK.common!]: LINK_SET_URL.execute,
    [KEY_EM_DASH.common!]: EM_DASH.execute,
    [KEY_EN_DASH.common!]: EN_DASH.execute,
    [KEY_INDENT_MORE.common!]: INDENT_MORE.execute,
    [KEY_INDENT_LESS.common!]: INDENT_LESS.execute,
    [KEY_TOGGLE_CODE_BLOCK.common!]: CODE.execute
  };
  return result;
}

export const getBaseKeymap = () => {
  baseKeymap.Enter = chainCommands(
    newlineInCode,
    createParagraphNear,
    liftEmptyBlock,
    splitToggleItemOrEnterContent(false),
    enterFromTitle,
    splitBlockKeepMarks
  );
  return baseKeymap;
};
