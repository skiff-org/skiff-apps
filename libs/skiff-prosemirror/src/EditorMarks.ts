import { Schema } from 'prosemirror-model';

import CodeMarkSpec from './CodeMarkSpec';
import CommentMarkSpec from './comments/CommentMarkSpec';
import DocNodeSpec from './DocNodeSpec';
import EMMarkSpec from './EMMarkSpec';
import FontSizeMarkSpec from './FontSizeMarkSpec';
import FontTypeMarkSpec from './FontTypeMarkSpec';
import HeadingNodeSpec from './HeadingNodeSpec';
import LinkMarkSpec from './LinkMarkSpec';
import * as MarkNames from './MarkNames';
import { DOC, DOC_DESCRIPTION, DOC_HEADER_HR, DOC_ICON, DOC_TITLE, HEADING, PARAGRAPH, TEXT } from './NodeNames';
import ParagraphNodeSpec from './ParagraphNodeSpec';
import { DocDescriptionNodeSpec } from './schema/specs/DocDescriptionNodeSpec';
import DocHeaderHrSpec from './schema/specs/DocHorizontalRuleSpec';
import { DocIconNodeSpec } from './schema/specs/docIconSpec';
import { DocTitleNodeSpec } from './schema/specs/DocTitleNodeSpec';
import SpacerMarkSpec from './SpacerMarkSpec';
import StrikeMarkSpec from './StrikeMarkSpec';
import StrongMarkSpec from './StrongMarkSpec';
import TextColorMarkSpec from './TextColorMarkSpec';
import TextHighlightMarkSpec from './TextHighlightMarkSpec';
import TextNodeSpec from './TextNodeSpec';
import TextNoWrapMarkSpec from './TextNoWrapMarkSpec';
import TextSelectionMarkSpec from './TextSelectionMarkSpec';
import TextSuperMarkSpec from './TextSuperMarkSpec';
import TextUnderlineMarkSpec from './TextUnderlineMarkSpec';
import YChangeMarkSpec from './YChangeMarkSpec';

const {
  MARK_CODE,
  MARK_EM,
  MARK_FONT_SIZE,
  MARK_FONT_TYPE,
  MARK_LINK,
  MARK_NO_BREAK,
  MARK_STRIKE,
  MARK_STRONG,
  MARK_SUPER,
  MARK_TEXT_COLOR,
  MARK_TEXT_HIGHLIGHT,
  MARK_TEXT_SELECTION,
  MARK_UNDERLINE,
  MARK_SPACER,
  MARK_COMMENT,
  MARK_YCHANGE
} = MarkNames;
// These nodes are required to build basic marks.
const nodes = {
  [HEADING]: HeadingNodeSpec,
  [PARAGRAPH]: ParagraphNodeSpec,
  [TEXT]: TextNodeSpec,
  [DOC]: DocNodeSpec,
  [DOC_ICON]: DocIconNodeSpec,
  [DOC_TITLE]: DocTitleNodeSpec,
  [DOC_DESCRIPTION]: DocDescriptionNodeSpec,
  [DOC_HEADER_HR]: DocHeaderHrSpec
};
const marks = {
  // Link mark should be rendered first.
  // https://discuss.prosemirror.net/t/prevent-marks-from-breaking-up-links/401/5
  [MARK_LINK]: LinkMarkSpec,
  [MARK_COMMENT]: CommentMarkSpec,
  [MARK_NO_BREAK]: TextNoWrapMarkSpec,
  [MARK_CODE]: CodeMarkSpec,
  [MARK_EM]: EMMarkSpec,
  [MARK_FONT_SIZE]: FontSizeMarkSpec,
  [MARK_FONT_TYPE]: FontTypeMarkSpec,
  [MARK_SPACER]: SpacerMarkSpec,
  [MARK_STRIKE]: StrikeMarkSpec,
  [MARK_STRONG]: StrongMarkSpec,
  [MARK_SUPER]: TextSuperMarkSpec,
  [MARK_TEXT_COLOR]: TextColorMarkSpec,
  [MARK_TEXT_HIGHLIGHT]: TextHighlightMarkSpec,
  [MARK_TEXT_SELECTION]: TextSelectionMarkSpec,
  [MARK_UNDERLINE]: TextUnderlineMarkSpec,
  [MARK_YCHANGE]: YChangeMarkSpec
};
const schema = new Schema({
  nodes,
  marks
});
const EditorMarks = schema.spec.marks;
export default EditorMarks;
