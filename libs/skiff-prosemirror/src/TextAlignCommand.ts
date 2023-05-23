import { CellSelection } from '@skiff-org/prosemirror-tables';
import { Node, NodeType, Schema } from 'prosemirror-model';
import { AllSelection, EditorState, TextSelection, Transaction } from 'prosemirror-state';

import { BLOCKQUOTE, HEADING, LIST_ITEM, PARAGRAPH } from './NodeNames';
import UICommand from './ui/UICommand';

export function setTextAlign(tr: Transaction, schema: Schema, alignment?: string | null): Transaction {
  const { selection, doc } = tr;

  if (!selection || !doc) {
    return tr;
  }

  let { from } = selection;
  const { to } = selection;

  // the editor is not mapping 'from' correctly when the selection is CellSelection.
  if (selection instanceof CellSelection) {
    from = selection.$anchorCell.pos;
  }

  interface Task {
    node: Node;
    pos: number;
    nodeType: NodeType;
  }

  const { nodes } = schema;
  const blockquote = nodes[BLOCKQUOTE];
  const listItem = nodes[LIST_ITEM];
  const heading = nodes[HEADING];
  const paragraph = nodes[PARAGRAPH];
  const tasks: Task[] = [];
  alignment = alignment || null;
  const allowedNodeTypes = new Set([blockquote, heading, listItem, paragraph]);

  if (selection instanceof CellSelection) {
    selection.forEachCell((cell, cellPos) => {
      doc.nodesBetween(cellPos, cellPos + cell.nodeSize, (node, pos) => {
        const nodeType = node.type;
        const align = node.attrs.align || '';
        if (align !== alignment && allowedNodeTypes.has(nodeType)) {
          tasks.push({
            node,
            pos,
            nodeType
          });
        }
        return true;
      });
    });
  } else {
    doc.nodesBetween(from, to, (node, pos) => {
      const nodeType = node.type;
      const align = node.attrs.align || '';
      if (align !== alignment && allowedNodeTypes.has(nodeType)) {
        tasks.push({
          node,
          pos,
          nodeType
        });
      }
      return true;
    });
  }

  if (!tasks.length) {
    return tr;
  }

  tasks.forEach((job) => {
    const { node, pos, nodeType } = job;
    let { attrs } = node;

    if (alignment) {
      attrs = {
        ...attrs,
        align: alignment
      };
    } else {
      attrs = {
        ...attrs,
        align: null
      };
    }

    tr = tr.setNodeMarkup(pos, nodeType, attrs, node.marks);
  });
  return tr;
}

class TextAlignCommand extends UICommand {
  _alignment: string;

  constructor(alignment: string) {
    super();
    this._alignment = alignment;
  }

  isActive = (state: EditorState): boolean => {
    const { selection, doc } = state;
    const { from, to } = selection;
    let keepLooking = true;
    let active = false;
    doc.nodesBetween(from, to, (node) => {
      if (keepLooking && node.attrs.align === this._alignment) {
        keepLooking = false;
        active = true;
      }

      return keepLooking;
    });
    return active;
  };

  isEnabled = (state: EditorState): boolean => {
    const { selection } = state;
    return (
      selection instanceof TextSelection || selection instanceof AllSelection || selection instanceof CellSelection
    );
  };

  execute = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    const { schema, selection } = state;
    const tr = setTextAlign(state.tr.setSelection(selection), schema, this._alignment);

    if (tr.docChanged) {
      dispatch?.(tr);
      return true;
    }
    return false;
  };
}

export default TextAlignCommand;
