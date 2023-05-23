import { InputRule } from 'prosemirror-inputrules';
import { MarkType, Schema } from 'prosemirror-model';

import getMarkdownActionCase, { AddMarkToText } from './getMarkdownActionCase';

/**
 * Formats text between backticks as code (adds mark)
 * Removes code formatting if text between backticks (`) contains code formatted text (removes mark)
 *
 * @param markType Type of the mark applied
 * @param schema ProseMirror Schema
 */

function codeRule(markType: MarkType, schema: Schema): InputRule {
  const pattern = new RegExp(`(\`)(.+?)\\1`);
  return new InputRule(pattern, (state, match, start, end) => {
    const { tr } = state;
    const matchString = match[0];
    // if we have three backticks we return, we don't want to interfere with codeBlock rule which uses ```
    if (matchString === '```') {
      return null;
    }
    const actionCase = getMarkdownActionCase(state, start, end, markType);
    if (actionCase === AddMarkToText.REMOVE) {
      return tr.removeMark(start, end, markType.create()).delete(start, start + 1);
    }
    return tr
      .addMark(tr.mapping.map(start), tr.mapping.map(end), markType.create())
      .delete(tr.mapping.map(start), tr.mapping.map(start) + 1)
      .removeStoredMark(markType)
      .insertText(' ');
  });
}
export default codeRule;
