import { InputRule } from 'prosemirror-inputrules';
import { Schema } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';

import nodeAt from '../nodeAt';
import { PARAGRAPH } from '../NodeNames';

/**
 * Returns an Input rule that replaces the characters defined in the Regex with a HorizontalRule node
 * @param pattern Regex patter defining what should be replaced
 * @param schema ProseMirror Schema
 */

function makeHorizontalRule(pattern: RegExp, schema: Schema) {
  return new InputRule(pattern, (state, match, start, end) => {
    const $start = state.doc.resolve(start);
    const node = nodeAt(state.doc, start);

    // If there is any other character is in the paragraph, we dont want to make a horizontal rule,
    // this allows the strongAndEmphasis rule to be used which also needs '***' or '___'
    // using dashes '---' will leave an emDash in the node.text (there is a rule for turning two dashes into an emDash)
    // but we check for '--' just in case if in the future that rule gets removed, this rule wont break
    if (!(node?.text === '**' || node?.text === '__' || node?.text === '—' || node?.text === '--')) {
      return null;
    }

    if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), schema.nodes.horizontal_rule)) {
      return null;
    }
    const tr = state.tr.replaceRangeWith(start, end, schema.nodes.horizontal_rule.create());
    // We want an extra paragraph before the <hr> https://www.markdownguide.org/basic-syntax/#horizontal-rules
    tr.insert(tr.mapping.map(start) - 1, schema.nodes[PARAGRAPH].create());
    tr.insert(tr.mapping.map(end), schema.nodes[PARAGRAPH].create());
    return tr.setSelection(TextSelection.create(tr.doc, tr.mapping.map(end)));
  });
}

/**
 * Turns EmDash (—)  followed by simple dash (-) to a horizontal rule
 */
export function horizontalRuleWithEmDash(schema: Schema) {
  const pattern = /—-/m;
  return makeHorizontalRule(pattern, schema);
}

/**
 * Turns 3 successive dash, star or underline character into a horizontal rule
 */
export function horizontalRuleStandard(schema: Schema) {
  const pattern = /-{3,}|\*{3,}|_{3,}/m;
  return makeHorizontalRule(pattern, schema);
}
