import { InputRule } from 'prosemirror-inputrules';
import { MarkType, Schema } from 'prosemirror-model';
/**
 * Turn text between three *** or ___ to bold and italic
 * @param strongMark
 * @param emphasisMark
 * @param schema
 */
function strongAndEmphasis(strongMark: MarkType, emphasisMark: MarkType, schema: Schema): InputRule {
  const pattern = /(\*\*\*|___)(.+?)\1/;
  return new InputRule(pattern, (state, match, start, end) => {
    const { tr } = state;

    return tr
      .addMark(start, end, strongMark.create())
      .addMark(start, end, emphasisMark.create())
      .delete(start, start + 3)
      .delete(tr.mapping.map(end - 2), tr.mapping.map(end))
      .removeStoredMark(strongMark)
      .removeStoredMark(emphasisMark);
  });
}

export default strongAndEmphasis;
