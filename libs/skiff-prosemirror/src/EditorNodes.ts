import { Schema } from 'prosemirror-model';

import BlockquoteNodeSpec from './BlockquoteNodeSpec';
import BookmarkNodeSpec from './BookmarkNodeSpec';
import BulletListNodeSpec from './BulletListNodeSpec';
import CodeBlockNodeSpec from './CodeBlockNodeSpec';
import DocNodeSpec from './DocNodeSpec';
import FileEmbedNodeSpec from './FileEmbedNodeSpec';
import HardBreakNodeSpec from './HardBreakNodeSpec';
import HeadingNodeSpec from './HeadingNodeSpec';
import HorizontalRuleNodeSpec from './HorizontalRuleNodeSpec';
import ImageNodeSpec from './ImageNodeSpec';
import ListItemNodeSpec from './ListItemNodeSpec';
import { MathDisplayNodeSpec, MathInlineNodeSpec } from './MathNodeSpecs';
import MentionNodeSpec from './MentionNodeSpec';
import * as NodeNames from './NodeNames';
import OrderedListNodeSpec from './OrderedListNodeSpec';
import ParagraphNodeSpec from './ParagraphNodeSpec';
import { DocDescriptionNodeSpec } from './schema/specs/DocDescriptionNodeSpec';
import DocHeaderHrSpec from './schema/specs/DocHorizontalRuleSpec';
import { DocIconNodeSpec } from './schema/specs/docIconSpec';
import { DocTitleNodeSpec } from './schema/specs/DocTitleNodeSpec';
import SubpageNodeSpec from './subpages/SubpageNodeSpec';
import TableNodesSpecs from './TableNodesSpecs';
import ListTaskNodeSpec from './TaskItemNodeSpec';
import TextNodeSpec from './TextNodeSpec';
import TodoListNodeSpec from './TodoListNodeSpec';
import ToggleItemNodeSpec, {
  ToggleItemContentNodeSpec,
  ToggleItemTitleNodeSpec
} from './toggleList/ToggleItemNodeSpec';
import ToggleListNodeSpec from './toggleList/ToggleListNodeSpec';

const {
  BLOCKQUOTE,
  BOOKMARK,
  BULLET_LIST,
  CODE_BLOCK,
  HEADING,
  PARAGRAPH,
  DOC,
  HARD_BREAK,
  HORIZONTAL_RULE,
  IMAGE,
  LIST_ITEM,
  ORDERED_LIST,
  TEXT,
  MENTION,
  MATH_INLINE,
  MATH_DISPLAY,
  TODO_LIST,
  LIST_TASK_ITEM,
  TOGGLE_LIST,
  TOGGLE_LIST_ITEM,
  TOGGLE_ITEM_TITLE,
  SUBPAGE,
  DOC_ICON,
  DOC_TITLE,
  DOC_DESCRIPTION,
  DOC_HEADER_HR,
  TOGGLE_ITEM_CONTENT,
  FILE_EMBED
} = NodeNames;
// https://github.com/ProseMirror/prosemirror-schema-basic/blob/master/src/schema-basic.js
// !! Be careful with the order of these nodes, which may effect the parsing
// outcome.!!
const nodes = {
  [DOC]: DocNodeSpec,
  [DOC_ICON]: DocIconNodeSpec,
  [DOC_TITLE]: DocTitleNodeSpec,
  [DOC_DESCRIPTION]: DocDescriptionNodeSpec,
  [DOC_HEADER_HR]: DocHeaderHrSpec,
  [PARAGRAPH]: ParagraphNodeSpec,
  [BLOCKQUOTE]: BlockquoteNodeSpec,
  [HORIZONTAL_RULE]: HorizontalRuleNodeSpec,
  [HEADING]: HeadingNodeSpec,
  [CODE_BLOCK]: CodeBlockNodeSpec,
  [TEXT]: TextNodeSpec,
  [IMAGE]: ImageNodeSpec,
  [HARD_BREAK]: HardBreakNodeSpec,
  [BULLET_LIST]: BulletListNodeSpec,
  [ORDERED_LIST]: OrderedListNodeSpec,
  [LIST_ITEM]: ListItemNodeSpec,
  [BOOKMARK]: BookmarkNodeSpec,
  [MENTION]: MentionNodeSpec,
  [FILE_EMBED]: FileEmbedNodeSpec,
  [MATH_INLINE]: MathInlineNodeSpec,
  [MATH_DISPLAY]: MathDisplayNodeSpec,
  [TODO_LIST]: TodoListNodeSpec,
  [LIST_TASK_ITEM]: ListTaskNodeSpec,
  [TOGGLE_LIST]: ToggleListNodeSpec,
  [TOGGLE_LIST_ITEM]: ToggleItemNodeSpec,
  [TOGGLE_ITEM_TITLE]: ToggleItemTitleNodeSpec,
  [TOGGLE_ITEM_CONTENT]: ToggleItemContentNodeSpec,
  [SUBPAGE]: SubpageNodeSpec
};
const marks = {};
const schema = new Schema({
  nodes,
  marks
});
const schemaNodes = schema.spec.nodes;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const EditorNodes = schemaNodes.append(TableNodesSpecs);
export default EditorNodes;
