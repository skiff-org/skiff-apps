import {
  baseKeymap,
  joinDown,
  joinUp,
  lift,
  selectParentNode,
  setBlockType,
  toggleMark,
  wrapIn
} from 'prosemirror-commands';
import { gapCursor } from 'prosemirror-gapcursor';
import { history, redo, undo } from 'prosemirror-history';
import { undoInputRule, wrappingInputRule } from 'prosemirror-inputrules';
import { ellipsis, emDash, inputRules, smartQuotes } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { NodeType, Schema } from 'prosemirror-model';
import { liftListItem, sinkListItem, splitListItem, wrapInList } from 'prosemirror-schema-list';
import { EditorState, Transaction } from 'prosemirror-state';
import { isIOS } from 'react-device-detect';

import { bindCommands } from '../createEditorKeyMap';
import blockQuote from '../inputRules/blockQuote';
import { bulletListRule, headingRule, orderedListRule } from '../inputRules/buildInputRules';
import codeRule from '../inputRules/codeRule';
import { linkFormatRule, linkFromBrackets, linkWithAngleBracketsRule } from '../inputRules/linkRules';
import InsertLinkOnEnter from '../InsertLinkOnEnter';
import MentionsMenuPlugin from '../mentionsMenu/MentionsMenuPlugin';

// : (NodeType) → InputRule
// Given a blockquote node type, returns an input rule that turns `"> "`
// at the start of a textblock into a blockquote.
export function blockQuoteRule(nodeType: NodeType) {
  return wrappingInputRule(/^\s*>\s$/, nodeType);
}

// : (Schema) → Plugin
// A set of input rules for creating the basic block quotes, lists,
// code blocks, and heading.
export function buildInputRules(schema: Schema) {
  const rules = smartQuotes.concat(ellipsis, emDash);

  if (schema.nodes.blockquote) rules.push(blockQuote());
  if (schema.marks.code) rules.push(codeRule(schema.marks.code, schema));
  if (schema.marks.link) rules.push(linkFormatRule(schema.marks.link, schema));
  if (schema.marks.link) rules.push(linkFromBrackets(schema.marks.link, schema));
  if (schema.marks.link) rules.push(linkWithAngleBracketsRule(schema.marks.link, schema));
  if (schema.nodes.ordered_list) rules.push(orderedListRule(schema.nodes.ordered_list));
  if (schema.nodes.bullet_list) rules.push(bulletListRule(schema.nodes.bullet_list));
  if (schema.nodes.heading) rules.push(headingRule(schema.nodes.heading, 6));
  return inputRules({ rules });
}

export function buildKeymap(schema: Schema) {
  const keys = {};
  let type;
  function bind(key: string, cmd: (state: EditorState, dispatch: Dispatch | undefined) => void) {
    keys[key] = cmd;
  }

  bind('Mod-z', undo);
  bind('Shift-Mod-z', redo);
  bind('Backspace', undoInputRule);
  if (!isIOS) bind('Mod-y', redo);

  bind('Alt-ArrowUp', joinUp);
  bind('Alt-ArrowDown', joinDown);
  bind('Mod-BracketLeft', lift);
  bind('Escape', selectParentNode);

  if ((type = schema.marks.strong)) {
    bind('Mod-b', toggleMark(type));
    bind('Mod-B', toggleMark(type));
  }
  if ((type = schema.marks.em)) {
    bind('Mod-i', toggleMark(type));
    bind('Mod-I', toggleMark(type));
  }
  if ((type = schema.marks.code)) bind('Mod-`', toggleMark(type));

  if ((type = schema.nodes.bullet_list)) bind('Shift-Ctrl-8', wrapInList(type));
  if ((type = schema.nodes.ordered_list)) bind('Shift-Ctrl-9', wrapInList(type));
  if ((type = schema.nodes.blockquote)) bind('Ctrl->', wrapIn(type));

  bind('Enter', baseKeymap.Enter);
  bind('Mod-Enter', baseKeymap.Enter);
  bind('Shift-Enter', baseKeymap.Enter);
  if ((type = schema.nodes.list_item)) {
    bind('Mod-Enter', bindCommands(splitListItem(type), baseKeymap.Enter));
    bind('Shift-Enter', bindCommands(splitListItem(type), baseKeymap.Enter));
    bind('Mod-[', liftListItem(type));
    bind('Mod-]', sinkListItem(type));
  }
  if ((type = schema.nodes.paragraph)) bind('Shift-Ctrl-0', setBlockType(type));
  if ((type = schema.nodes.heading))
    for (let i = 1; i <= 6; i++) bind('Shift-Ctrl-' + i, setBlockType(type, { level: i }));
  if ((type = schema.nodes.horizontal_rule)) {
    const hr = type;
    bind('Mod-_', (state, dispatch) => {
      if (dispatch) dispatch(state.tr.replaceSelectionWith(hr.create()).scrollIntoView());
      return true;
    });
  }

  return keys;
}

type Dispatch = (tr: Transaction) => void;

const onEnter = (cb: (state: EditorState, dispatch: Dispatch) => boolean) => ({
  Enter: (state: EditorState, dispatch: Dispatch | undefined) => {
    if (dispatch) return cb(state, dispatch);
    return false;
  }
});

export function setupPlugins(options: {
  schema: Schema;
  onEnter: (state: EditorState, dispatch: Dispatch) => boolean;
}) {
  const plugins = [
    MentionsMenuPlugin(true),
    InsertLinkOnEnter,
    buildInputRules(options.schema),
    keymap(onEnter(options.onEnter)),
    keymap(buildKeymap(options.schema)),
    keymap(baseKeymap),
    history(),
    gapCursor()
  ];

  return plugins;
}
