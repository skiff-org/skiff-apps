import { InputRule } from 'prosemirror-inputrules';
import { MarkType, Schema } from 'prosemirror-model';

import getMarkdownActionCase, { AddMarkToText } from './getMarkdownActionCase';

/**
 * Turn text between two tilde characters (~~) into strikethrough text
 * @param markType strikethrough mark
 * @param schema prosemirror schema
 */

function strikeThrough(markType: MarkType, schema: Schema): InputRule {
  const pattern = /(~~)(.+?)\1/;
  return new InputRule(pattern, (state, match, start, end) => {
    const { tr } = state;
    const actionCase = getMarkdownActionCase(state, start + 2, end - 1, markType);
    if (actionCase === AddMarkToText.REMOVE) {
      return tr
        .removeMark(start, end, markType.create())
        .delete(start, start + 2)
        .delete(tr.mapping.map(end) - 1, tr.mapping.map(end));
    }
    return tr
      .addMark(start, end, markType.create())
      .delete(start, start + 2)
      .delete(tr.mapping.map(end) - 1, tr.mapping.map(end))
      .removeStoredMark(markType);
  });
}
export default strikeThrough;
