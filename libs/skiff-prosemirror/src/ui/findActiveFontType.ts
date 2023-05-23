import { EditorState, TextSelection } from 'prosemirror-state';

import findActiveMarks from '../findActiveMarks';
import { FontNameIds, FontNameLabels } from '../FontTypeMarkSpec';
import { MARK_FONT_TYPE } from '../MarkNames';
// This should map to `--skiff-content-font-type` at `skiff-editor.css`.
export const FONT_TYPE_LABEL_DEFAULT = FontNameLabels.SYSTEM;

export function findLabelFromName(name?: FontNameIds): string {
  if (!name) return FONT_TYPE_LABEL_DEFAULT;
  const fontKey = Object.values(FontNameIds).indexOf(name);
  const label = Object.values(FontNameLabels).filter((_, idx) => idx === fontKey);
  return label.length > 0 ? label[0] : FONT_TYPE_LABEL_DEFAULT;
}

export default function findActiveFontType(state: EditorState): string {
  const { schema, doc, selection, tr } = state;
  const markType = schema.marks[MARK_FONT_TYPE];

  if (!markType) {
    return FONT_TYPE_LABEL_DEFAULT;
  }

  const { from, to, empty } = selection;

  if (empty && selection instanceof TextSelection) {
    const storedMarks =
      tr.storedMarks ||
      state.storedMarks ||
      (selection.$cursor && selection.$cursor.marks && selection.$cursor.marks()) ||
      [];
    const sm = storedMarks.find((m) => m.type === markType);
    return findLabelFromName(sm?.attrs.name);
  }

  const marks = markType ? findActiveMarks(doc, from, to, markType) : [];
  let fontName;

  if (marks?.length) {
    fontName = marks.length > 1 ? '...' : marks[0] && marks[0].attrs.name;
  }

  return findLabelFromName(fontName);
}
