import { tableNodes } from '@skiff-org/prosemirror-tables';
import { Node as PMNode } from 'prosemirror-model';

// https://github.com/ProseMirror/prosemirror-tables/blob/master/demo.js
const TableNodesSpecs = tableNodes({
  tableGroup: 'block',
  cellContent: 'block+',
  cellContentGroup: 'block',
  cellAttributes: {}
});
// Override the default table node spec to support custom attributes.
const TableNodeSpec = {
  ...TableNodesSpecs.table,
  parseDOM: [
    {
      tag: 'table',

      getAttrs(dom: HTMLElement): Record<string, any> | null | undefined {
        const { marginLeft } = dom.style;

        if (marginLeft && /\d+px/.test(marginLeft)) {
          return {
            marginLeft: parseFloat(marginLeft)
          };
        }

        return undefined;
      }
    }
  ],

  toDOM(node: PMNode): Array<any> {
    // Normally, the DOM structure of the table node is rendered by
    // `TableNodeView`. This method is only called when user selects a
    // table node and copies it, which triggers the "serialize to HTML" flow
    //  that calles this method.
    const { marginLeft } = node.attrs;
    const domAttrs: { style?: string } = {};

    if (marginLeft) {
      domAttrs.style = `margin-left: ${marginLeft}px`;
    }

    return ['table', domAttrs, 0];
  }
};
Object.assign(TableNodeSpec.attrs || {}, {
  marginLeft: {
    default: null
  }
});
Object.assign(TableNodesSpecs, {
  table: TableNodeSpec
});
export default TableNodesSpecs;
