import { InputRule } from 'prosemirror-inputrules';
import { EditorState, Transaction } from 'prosemirror-state';

import { BLOCKQUOTE } from '../NodeNames';
import toggleBlockquote from '../toggleBlockquote';
// Given a blockquote node type, returns an input rule that turns `"> "`
// at the start of a textblock into a blockquote.
const MACRO_PATTERN = /^\s*>\s$/;

function handleBlockQuoteInputRule(state: EditorState, match: any, start: any, end: any): Transaction {
  const { schema } = state;
  let { tr } = state;
  const nodeType = schema.nodes[BLOCKQUOTE];

  if (!nodeType) {
    return tr;
  }

  tr = toggleBlockquote(tr, schema);

  if (tr.docChanged) {
    tr = tr.delete(start, end);
  }

  return tr;
}

export default function blockQuote(): InputRule {
  return new InputRule(MACRO_PATTERN, handleBlockQuoteInputRule);
}
