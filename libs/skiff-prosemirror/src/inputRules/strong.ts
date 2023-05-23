// creates an input rule to enable emphasis if emphasis is already applied, removes it
import { InputRule } from 'prosemirror-inputrules';
import { MarkType, Schema } from 'prosemirror-model';

import getMarkdownActionCase, { AddMarkToText } from './getMarkdownActionCase';

/**
 * Turns text between 2 star (*) or underline (_) character into bold
 * @param markType
 * @param schema
 */

function strong(markType: MarkType, schema: Schema): InputRule {
  const pattern = /(\*\*|__)(.+?)\1/;
  return new InputRule(pattern, (state, match, start, end) => {
    const { tr } = state;
    const firstChars = match[0].slice(0, 3);
    // if the first three character is *** or ___ the user wants to do a bold and italic command so we return,
    // we could solve this with regEx but lookahead has some issues with safari at the time of writing the code
    if (firstChars === '***' || firstChars === '___') {
      return null;
    }
    const actionCase = getMarkdownActionCase(state, start + 2, end - 1, markType);
    if (actionCase === AddMarkToText.REMOVE) {
      return tr
        .removeMark(start, end, markType.create())
        .delete(start, start + 2)
        .delete(tr.mapping.map(end - 1), tr.mapping.map(end));
    }
    return tr
      .addMark(start, end, markType.create())
      .delete(start, start + 2)
      .delete(tr.mapping.map(end - 1), tr.mapping.map(end))
      .removeStoredMark(markType);
  });
}

export default strong;
