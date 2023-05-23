import { DOMOutputSpec, Node as PMNode, NodeSpec } from 'prosemirror-model';

import convertToCSSPTValue from './convertToCSSPTValue';
import clamp from './ui/clamp';
import toCSSLineSpacing from './ui/toCSSLineSpacing';
// This assumes that every 36pt maps to one indent level.
export const INDENT_MARGIN_PT_SIZE = 36;
export const MIN_INDENT_LEVEL = 0;
export const MAX_INDENT_LEVEL = 7;
export const ATTRIBUTE_INDENT = 'data-indent';
export const EMPTY_CSS_VALUE = new Set(['', '0%', '0pt', '0px']);
const ALIGN_PATTERN = /(left|right|center|justify)/;
// https://github.com/ProseMirror/prosemirror-schema-basic/blob/master/src/schema-basic.js
// :: NodeSpec A plain paragraph textblock. Represented in the DOM
// as a `<p>` element.
const ParagraphNodeSpec: NodeSpec = {
  attrs: {
    align: {
      default: null
    },
    color: {
      default: null
    },
    id: {
      default: null
    },
    indent: {
      default: null
    },
    lineSpacing: {
      default: null
    },
    // TODO: Add UI to let user edit / clear padding.
    paddingBottom: {
      default: null
    },
    // TODO: Add UI to let user edit / clear padding.
    paddingTop: {
      default: null
    },
    ychange: { default: null }
  },
  content: 'inline*',
  group: 'block',
  parseDOM: [
    {
      tag: 'p',
      getAttrs: getParagraphNodeAttrs
    }
  ],
  toDOM: toParagraphDOM
};

export function getParagraphNodeAttrs(dom: Node | string) {
  if (!(dom instanceof HTMLElement)) {
    return {};
  }

  const { lineHeight, textAlign, marginLeft, paddingTop, paddingBottom } = dom.style;
  let align: string | null = dom.getAttribute('align') || textAlign || '';
  align = ALIGN_PATTERN.test(align) ? align : null;
  let indent = parseInt(dom.getAttribute(ATTRIBUTE_INDENT) || '0', 10);

  if (!indent && marginLeft) {
    indent = convertMarginLeftToIndentValue(marginLeft);
  }

  indent = indent || MIN_INDENT_LEVEL;
  const lineSpacing = lineHeight ? toCSSLineSpacing(lineHeight) : null;
  const id = dom.getAttribute('id') || '';

  return {
    align,
    indent,
    lineSpacing,
    paddingTop,
    paddingBottom,
    id
  };
}

export function toParagraphDOM(node: PMNode): DOMOutputSpec {
  const { align, indent, lineSpacing, paddingTop, paddingBottom, id, ychange } = node.attrs;
  const attrs: {
    id?: string;
    ychange_type?: string;
    style?: string;
    class?: string;
  } = {};
  let style = '';

  if (align && align !== 'left') {
    style += `text-align: ${align};`;
    attrs.class = `text-align-${align}`;
  }

  if (lineSpacing) {
    const cssLineSpacing = toCSSLineSpacing(lineSpacing);
    style +=
      `line-height: ${cssLineSpacing};` + // This creates the local css variable `--skiff-content-line-height`
      // that its children may apply.
      `--skiff-content-line-height: ${cssLineSpacing}`;
  }

  if (paddingTop && !EMPTY_CSS_VALUE.has(paddingTop)) {
    style += `padding-top: ${paddingTop};`;
  }

  if (paddingBottom && !EMPTY_CSS_VALUE.has(paddingBottom)) {
    style += `padding-bottom: ${paddingBottom};`;
  }

  if (style) attrs.style = style;

  if (indent) {
    attrs[ATTRIBUTE_INDENT] = String(indent);
  }

  if (id) {
    attrs.id = id;
  }
  if (ychange) {
    attrs.ychange_type = ychange.type;
  }
  return ['p', attrs, 0];
}

export function convertMarginLeftToIndentValue(marginLeft: string): number {
  const ptValue = convertToCSSPTValue(marginLeft);
  return clamp(MIN_INDENT_LEVEL, Math.floor(ptValue / INDENT_MARGIN_PT_SIZE), MAX_INDENT_LEVEL);
}
export default ParagraphNodeSpec;
