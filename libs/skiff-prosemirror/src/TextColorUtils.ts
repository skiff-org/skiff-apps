import { Node as ProsemirrorNode } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { MARK_TEXT_COLOR, MARK_TEXT_HIGHLIGHT } from './MarkNames';
import { TEXT } from './NodeNames';
import { TEXT_COLOR_ATTRIBUTE } from './TextColorMarkSpec';
import { TEXT_HIGHLIGHT_COLOR_ATTRIBUTE } from './TextHighlightMarkSpec';

type TextColorAttributes = typeof TEXT_COLOR_ATTRIBUTE | typeof TEXT_HIGHLIGHT_COLOR_ATTRIBUTE;
type TextColorMarksNames = typeof MARK_TEXT_COLOR | typeof MARK_TEXT_HIGHLIGHT;

export const isTextColorActive = (
  state: EditorState,
  color: string,
  markName: TextColorMarksNames,
  attribute: TextColorAttributes
) => {
  const { selection: sel } = state;
  const colorMark = state.schema.marks[markName];
  let colorActive = true;
  let hasText = false;
  sel.content().content.descendants((node: ProsemirrorNode) => {
    if (node.type.name === TEXT) {
      hasText = true;
      if (!colorMark.isInSet(node.marks)) {
        colorActive = false;
        return false;
      }
      const mark = node.marks.find((nodeMark) => nodeMark.type.name === colorMark.name);
      if (!mark) {
        colorActive = false;
        return false;
      }
      colorActive = colorActive && mark?.attrs[attribute] === color;

      return false;
    }
    return true;
  });
  return colorActive && hasText;
};
