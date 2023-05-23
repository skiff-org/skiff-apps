import { NodeSpec } from 'prosemirror-model';

const DOM_ATTRIBUTE_PAGE_BREAK = 'data-page-break';

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

const HorizontalRuleNode: NodeSpec = {
  attrs: {
    pageBreak: {
      default: null
    }
  },
  group: 'block',
  parseDOM: [
    {
      tag: 'hr',
      getAttrs
    }
  ],

  toDOM(node) {
    const domAttrs: { style?: string } = {};

    if (node.attrs.pageBreak) {
      domAttrs[DOM_ATTRIBUTE_PAGE_BREAK] = 'true';
    }

    domAttrs.style = 'margin: 16px auto; background: var(--border-secondary); border: none; height: 1px;';
    return ['hr', domAttrs];
  }
};
export default HorizontalRuleNode;
