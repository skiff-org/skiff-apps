import { makeBlockMathInputRule, makeInlineMathInputRule, REGEX_BLOCK_MATH_DOLLARS } from '@benrbray/prosemirror-math';
import {
  ellipsis,
  emDash,
  InputRule,
  inputRules,
  smartQuotes,
  textblockTypeInputRule,
  wrappingInputRule
} from 'prosemirror-inputrules';
import { NodeType, Schema } from 'prosemirror-model';
import { NodeSelection, TextSelection } from 'prosemirror-state';
import { Plugin } from 'prosemirror-state';
import { findParentNode } from 'prosemirror-utils';

import { MARK_CODE, MARK_EM, MARK_LINK, MARK_STRIKE, MARK_STRONG } from '../MarkNames';
import { BULLET_LIST, CODE_BLOCK, HEADING, LIST_ITEM, ORDERED_LIST, PARAGRAPH, TODO_LIST } from '../NodeNames';
import toggleList from '../toggleList';

import blockQuote from './blockQuote';
import codeRule from './codeRule';
import { horizontalRuleStandard, horizontalRuleWithEmDash } from './divider';
import emphasisRule from './emphasisRule';
import { linkFormatRule, linkFromBrackets, linkWithAngleBracketsRule } from './linkRules';
import strikeThrough from './strikeThrough';
import strong from './strong';
import strongAndEmphasis from './strongAndEmphasis';

// This file is forked from
// // https://github.com/ProseMirror/prosemirror-example-setup/blob/master/src/inputrules.js
// : (NodeType) → InputRule

// https://github.com/benrbray/prosemirror-math/blob/master/src/plugins/math-inputrules.ts
const REGEX_INLINE_MATH_DOLLARS = /\$([^\s]+)\$/; // matches strings enclosed in $ without whitespace

/**
 * Returns the input rules the editor uses
 */
const imageInputRule = new InputRule(/!\[(.*?)\]\((https?:\/\/.*?)(?=\))\)/, (state, match, start, end) => {
  const [_fullMatch, altText, srcUrl] = match;
  const attrs = { src: srcUrl, alt: altText };

  const tr = state.tr.replaceWith(start, end, state.schema.nodes.image.create(attrs));
  return tr;
});

// Triggers the same function ListToggleCommand would, and deletes two characters the user just entered with the inputRule
export const orderedListRule = (nodeType: NodeType) => {
  const pattern = /^(\d+)\.\s$/;
  return new InputRule(pattern, (state, match, start, end) => {
    const parentNodeType = state.selection.$from.parent.type.name;
    if (parentNodeType !== PARAGRAPH) return null;
    let { tr } = state;
    const { selection, schema } = state;
    const hasListItemAsParent = findParentNode((node) => node.type.name === schema.nodes[LIST_ITEM].name)(selection);
    // we disable this rule when we are already in a list item to avoid toggling out of the list node
    if (hasListItemAsParent) {
      return null;
    }
    tr = toggleList(tr.setSelection(selection), schema, nodeType);
    // delete the last two characters (number + period) which is the two characters before the cursor
    tr = tr.delete(tr.selection.from - 2, tr.selection.from);

    return tr;
  });
};
// : (NodeType) → InputRule
// Given a list node type, returns an input rule that turns a bullet
// (dash, plush, or asterisk) at the start of a textBlock into a
// bullet list.
export const bulletListRule = (nodeType: NodeType): InputRule => wrappingInputRule(/^\s*([-+*])\s$/, nodeType);

// : (NodeType) → InputRule
// Given a list node type, returns an input rule that turns a bullet
// (dash, plush, or asterisk) at the start of a textBlock into a
// bullet list.
function taskListRule(nodeType: NodeType): InputRule {
  return wrappingInputRule(/^\s*(-\[\])\s$/, nodeType);
}

// : (NodeType) → InputRule
// Given a code block node type, returns an input rule that turns a textBlock starting with three backticks into a code block
export const codeBlockRule = (nodeType: NodeType) => {
  const pattern = /^```$/;
  return new InputRule(pattern, (state, match, start, end) => {
    const $start = state.doc.resolve(start);

    if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), nodeType)) {
      return null;
    }

    const tr = state.tr.replaceRangeWith(start, end, nodeType.create());
    return tr.setSelection(TextSelection.create(tr.doc, $start.pos));
  });
};

// : (NodeType, number) → InputRule
// Given a node type and a maximum level, creates an input rule that
// turns up to that number of `#` characters followed by a space at
// the start of a textBlock into a heading whose level corresponds to
// the number of `#` signs.
export const headingRule = (nodeType: NodeType, maxLevel: number): InputRule =>
  textblockTypeInputRule(new RegExp(`^(#{1,${maxLevel}})\\s$`), nodeType, (match) => ({
    level: match[1].length
  }));

// Changing '-->' and '- >' into UTF 8 arrow char. '--' turns into emDash first so we check for emDash arrow input in rule
function rightArrowRule() {
  return new InputRule(/(-> ?)$/, '→');
}
function leftArrowRule() {
  return new InputRule(/(<- ?)$/, '←');
}
function inlineInputRule(pattern: RegExp, nodeType: NodeType, getAttrs?: (match: string[]) => any) {
  return new InputRule(pattern, (state, match, start, end) => {
    const $start = state.doc.resolve(start);
    const index = $start.index();
    const $end = state.doc.resolve(end);
    // get attrs
    const attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;

    // check if replacement valid
    if (!$start.parent.canReplaceWith(index, $end.index(), nodeType)) {
      return null;
    }

    if (match[0].endsWith('\\$')) {
      return null; // ignore end on escaped \$
    }

    const offset = match[0].startsWith(' ') ? 1 : 0;
    // perform replacement
    return state.tr.replaceRangeWith(start + offset, end, nodeType.create(attrs, nodeType.schema.text(match[1])));
  });
}

function blockInputRule(pattern: RegExp, nodeType: NodeType, schema: Schema) {
  return new InputRule(pattern, (state, match, start, end) => {
    const $start = state.doc.resolve(start);

    if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), nodeType)) {
      return null;
    }

    const tr = state.tr.replaceRangeWith(start, end, nodeType.create());
    return tr.setSelection(NodeSelection.create(tr.doc, tr.mapping.map($start.pos - 1)));
  });
} // : (Schema) → Plugin
// A set of input rules for creating the basic block quotes, lists,
// code blocks, and heading.

export default function buildInputRules(schema: Schema): Plugin {
  // make math input rules for support $...$ | $$
  const inlineMathInputRule = makeInlineMathInputRule(REGEX_INLINE_MATH_DOLLARS, schema.nodes.math_inline);
  // make math input rules for support $...$ | $$
  const blockMathInputRule = makeBlockMathInputRule(REGEX_BLOCK_MATH_DOLLARS, schema.nodes.math_display);

  const rules = smartQuotes.concat(ellipsis, emDash);
  rules.push(rightArrowRule());
  rules.push(leftArrowRule());

  rules.push(imageInputRule);
  rules.push(headingRule(schema.nodes[HEADING], 6));
  rules.push(linkFormatRule(schema.marks[MARK_LINK], schema));
  rules.push(linkFromBrackets(schema.marks[MARK_LINK], schema));
  rules.push(linkWithAngleBracketsRule(schema.marks[MARK_LINK], schema));
  rules.push(emphasisRule(schema.marks[MARK_EM], schema));
  rules.push(strong(schema.marks[MARK_STRONG], schema));
  rules.push(codeRule(schema.marks[MARK_CODE], schema));
  rules.push(strikeThrough(schema.marks[MARK_STRIKE], schema));

  rules.push(orderedListRule(schema.nodes[ORDERED_LIST]));
  rules.push(taskListRule(schema.nodes[TODO_LIST]));
  rules.push(bulletListRule(schema.nodes[BULLET_LIST]));
  rules.push(codeBlockRule(schema.nodes[CODE_BLOCK]));
  rules.push(strongAndEmphasis(schema.marks[MARK_STRONG], schema.marks[MARK_EM], schema));

  rules.push(horizontalRuleWithEmDash(schema));
  rules.push(horizontalRuleStandard(schema));
  rules.push(blockQuote());

  rules.push(inlineMathInputRule);
  rules.push(blockMathInputRule);

  return inputRules({
    rules
  });
}
