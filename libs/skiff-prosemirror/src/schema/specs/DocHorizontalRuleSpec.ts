import { NodeSpec } from 'prosemirror-model';

const DOM_ATTRIBUTE_PAGE_BREAK = 'xlarge-break';
const DOC_HORIZONTAL_RULE_CLASS = 'xlarge-hr-header';

// Index inside the doc - help with finding the node
export const DOC_HR_INDEX = 3;

function getAttrs(dom: Node | string) {
  const attrs: { pageBreak?: boolean } = {};

  if (
    dom instanceof HTMLElement &&
    (dom.getAttribute(DOM_ATTRIBUTE_PAGE_BREAK) || dom.style.pageBreakBefore === 'always')
  ) {
    // Google Doc exports page break as HTML:
    // `<hr style="page-break-before:always;display:none; />`.
    attrs.pageBreak = true;
  }

  return attrs;
}

const DocHeaderHrSpec: NodeSpec = {
  attrs: {
    pageBreak: {
      default: null
    }
  },
  parseDOM: [
    {
      tag: `hr.${DOC_HORIZONTAL_RULE_CLASS}`,
      getAttrs,
      priority: 100
    }
  ],
  selectable: false,
  // atom: true,
  toDOM(node) {
    const domAttrs: { style?: string; class?: string } = {};

    if (node.attrs.pageBreak) {
      domAttrs[DOM_ATTRIBUTE_PAGE_BREAK] = 'true';
    }

    domAttrs.style = 'background-color: var(--border-secondary); border: none; height: 1px;';
    domAttrs.class = DOC_HORIZONTAL_RULE_CLASS;
    return ['hr', domAttrs];
  }
};
export default DocHeaderHrSpec;
