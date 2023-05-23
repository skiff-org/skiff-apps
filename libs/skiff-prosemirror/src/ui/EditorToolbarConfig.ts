// eslint-disable-next-line no-unused-vars
import * as EditorCommands from '../EditorCommands';

import FontSizeCommandMenuButton from './FontSizeCommandMenuButton';
import FontTypeCommandMenuButton from './FontTypeCommandMenuButton';
import HeadingCommandMenuButton from './HeadingCommandMenuButton';
import Icon from './Icon';

const ICON_LABEL_PATTERN = /\[([A-Za-z_\d]+)\](.*)/;
export function parseLabel(input: string): Record<string, any> {
  const matched = input.match(ICON_LABEL_PATTERN);

  if (matched) {
    const [icon, label] = matched;
    return {
      icon: icon ? Icon.get(icon) : null,
      title: label || null
    };
  }

  return {
    icon: null,
    title: input || null
  };
}
const {
  CLEAR_FORMAT,
  HR,
  INDENT_LESS,
  INDENT_MORE,
  OL,
  STRIKE,
  TABLE_INSERT_TABLE,
  TEXT_ALIGN_CENTER,
  TEXT_ALIGN_JUSTIFY,
  TEXT_ALIGN_LEFT,
  TEXT_ALIGN_RIGHT,
  TEXT_COLOR,
  TEXT_HIGHLIGHT,
  UL,
  TO_DO,
  MATH_INSERT,
  LINK_SET_URL
} = EditorCommands;
export const COMMAND_GROUPS = [
  {
    '[text] Font type': FontTypeCommandMenuButton,
    '[text] Heading size': HeadingCommandMenuButton,
    '[text] Text size': FontSizeCommandMenuButton
  },
  {
    '[text] Text color': TEXT_COLOR,
    '[text] Highlight color': TEXT_HIGHLIGHT
  },
  {
    '[text] Left align': TEXT_ALIGN_LEFT,
    '[text] Center Align': TEXT_ALIGN_CENTER,
    '[text] Right Align': TEXT_ALIGN_RIGHT,
    '[text] Justify': TEXT_ALIGN_JUSTIFY
  },
  {
    '[text] Numbered list': OL,
    '[text] Bulleted list': UL,
    '[text] Todo list': TO_DO
  },
  {
    '[text] Indent less': INDENT_LESS,
    '[text] Indent more': INDENT_MORE
  },
  {
    '[text] Insert Table': TABLE_INSERT_TABLE
  },
  {
    '[text] Insert Link': LINK_SET_URL
  },
  {
    '[text] Clear formats': CLEAR_FORMAT,
    '[text] Horizontal rule': HR,
    '[text] Strike through': STRIKE
  },
  {
    '[text] Insert math': MATH_INSERT
  }
];
