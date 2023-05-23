// creates an input rule to enable emphasis if emphasis is already applied it removes it
import { InputRule } from 'prosemirror-inputrules';
import { MarkType, Schema } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';

import getMarkdownActionCase, { AddMarkToText } from './getMarkdownActionCase';

// Creates the transaction to be returned
const createTransaction = (
  state: EditorState,
  actionCase: AddMarkToText,
  start: number,
  end: number,
  markType: MarkType,
  startTrim: number
) => {
  if (actionCase === AddMarkToText.REMOVE) {
    return state.tr.removeMark(start, end, markType.create()).delete(start, start + startTrim);
  }

  return state.tr
    .addMark(start, end, markType.create())
    .delete(start, start + startTrim)
    .removeStoredMark(markType);
};
// This helper fn handles the case when the user wants to use emphasis within bold eg.:**SomethingBold *BoldItalic* just Bold**
// To avoid code duplication, it deals with both '*' and '_' as they can both be used for emphasis
// Returns a transaction or null which we want to return from the input rule, in case of undefined the inputRule will not return anything depending on this fn
const nestedEmphasis = (
  state: EditorState,
  pattern: RegExp,
  actionCase: AddMarkToText,
  start: number,
  end: number,
  specialChar: string,
  firstChars: string,
  lastChar: string,
  mString: string,
  markType: MarkType,
  startTrim: number
): Transaction | null | undefined => {
  if (firstChars === `${specialChar}${specialChar}`) {
    if (lastChar === `${specialChar}`) {
      const newMatch = mString?.slice(2).match(pattern);
      // start gets us to the start beginning of the paragraph, +2 is to jump over the ** we sliced, and index is the position inside the match input
      if (newMatch?.index !== undefined) {
        const newStart = start + 2 + newMatch?.index;
        return createTransaction(state, actionCase, newStart, end, markType, startTrim);
      }
    }
    return null;
  }
  return undefined;
};

/**
 * Turns text between star (*) or underline (_) characters into italic font (also called emphasis)
 * @param markType Type of the mark applied
 * @param schema ProseMirror Schema
 */

function emphasisRule(markType: MarkType, schema: Schema): InputRule {
  const pattern = /( |\n|^)([*_])(.+?)\2( |\n|$)(?!.)/;

  return new InputRule(pattern, (state, match, start, end) => {
    const actionCase = getMarkdownActionCase(state, start, end, markType);
    const mString = match[0].trim();
    const firstChars = mString.slice(0, 2);
    const lastChar = mString.slice(mString.length - 1, mString.length);

    // if the match starts with whitespace apply all changes to the text after him
    const startTrim = match[0].startsWith(' ') ? 1 : 0;

    const nestedWithStars = nestedEmphasis(
      state,
      pattern,
      actionCase,
      start,
      end,
      '*',
      firstChars,
      lastChar,
      mString,
      markType,
      startTrim
    );
    const nestedWithUnderscore = nestedEmphasis(
      state,
      pattern,
      actionCase,
      start,
      end,
      '_',
      firstChars,
      lastChar,
      mString,
      markType,
      startTrim
    );

    if (nestedWithStars !== undefined) {
      return nestedWithStars;
    }
    if (nestedWithUnderscore !== undefined) {
      return nestedWithUnderscore;
    }

    // the match result contains also the whitespace if there is one,
    // we want to keep keep him so we set the start as start + 1 so all want be applied on the whitespace
    return createTransaction(state, actionCase, start + 1, end, markType, startTrim);
  });
}
export default emphasisRule;
