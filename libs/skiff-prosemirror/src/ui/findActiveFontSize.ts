import { Mark } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { findParentNodeOfType } from 'prosemirror-utils';

import findActiveMarks from '../findActiveMarks';
import { MARK_FONT_SIZE } from '../MarkNames';
import { HEADING } from '../NodeNames';
// This should map to `--skiff-content-font-size` at `skiff-vars.css`.
export const FONT_PX_SIZE_DEFAULT = 17;
// This should map to `skiff-heading.css`.
const MAP_HEADING_LEVEL_TO_FONT_PX_SIZE = {
  1: 32,
  2: 28,
  3: 24,
  4: 20,
  5: 17,
  6: 15
};

export default function findActiveFontSize(state: EditorState): string {
  const { schema, doc, selection, tr } = state;
  const markType = schema.marks[MARK_FONT_SIZE];
  const heading = schema.nodes[HEADING];
  const defaultSize = String(FONT_PX_SIZE_DEFAULT);
  if (!(selection instanceof TextSelection)) return defaultSize;
  const { $cursor, empty, from, to } = selection;

  if (!markType) {
    return defaultSize;
  }

  if (empty) {
    const storedMarks: Mark[] = tr.storedMarks || state.storedMarks || $cursor?.marks?.() || [];
    const sm = storedMarks.find((m) => m.type === markType);
    return sm ? String(sm.attrs.px || defaultSize) : defaultSize;
  }

  const marks = markType ? findActiveMarks(doc, from, to, markType) : [];
  let fontSize;

  if (marks?.length) {
    fontSize = marks.length > 1 ? '...' : marks[0] && (marks[0].attrs.px || defaultSize);
  }

  if (fontSize) {
    return String(fontSize);
  }

  if (!heading) {
    return defaultSize;
  }

  const result = findParentNodeOfType(heading)(state.selection);

  if (!result) {
    return defaultSize;
  }

  const level = String(result.node.attrs.level);
  return MAP_HEADING_LEVEL_TO_FONT_PX_SIZE[level] || defaultSize;
}
