import { EditorState, Plugin, Transaction } from 'prosemirror-state';

import { CODE_BLOCK, PARAGRAPH } from './NodeNames';

const DEFAULT_LAST_ELEMENT = PARAGRAPH;

// this plugin is making sure the document will always ends with a paragraph.
// so the user can always access the end of the document no matter what is th last node.
const endWithTextBlock = () =>
  new Plugin({
    appendTransaction(transactions: Transaction[], oldState: EditorState, newState: EditorState) {
      const docLastChild = newState.doc.lastChild;
      // Code block has inline content, hence it will satisfy .isTextBlock condition, but we still need to insert a paragraph after it, second condition ensures this
      if (docLastChild?.isTextblock && docLastChild.type !== newState.schema.nodes[CODE_BLOCK]) return null;

      const { tr } = newState;
      const emptyTextBLock = newState.schema.nodes[DEFAULT_LAST_ELEMENT].createAndFill();

      if (!emptyTextBLock) return null;

      tr.insert(newState.doc.nodeSize - 2, emptyTextBLock);

      return tr;
    }
  });

export default endWithTextBlock;
