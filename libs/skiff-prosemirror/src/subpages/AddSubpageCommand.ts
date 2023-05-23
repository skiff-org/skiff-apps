import { Fragment, NodeType } from 'prosemirror-model';
import { EditorState, TextSelection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { SUBPAGE } from '../NodeNames';
import { getCustomState } from '../skiffEditorCustomStatePlugin';
import UICommand from '../ui/UICommand';
import uuid from '../ui/uuid';

import { stopPreventRemoveSubpage } from './SubpagePlugin';

const START_TITLE = '';

/**
 *
 * creates a transaction for adding a new subpage node at a position
 */
const createSubpageNode = (tr: Transaction, docID: string, pos: number, nodeType: NodeType) => {
  const attrs = {
    nodeID: uuid(),
    docID,
    type: 'large'
  };
  const node = nodeType.create(attrs);
  const frag = Fragment.from(node);
  tr.setMeta(stopPreventRemoveSubpage, true);
  tr = tr.insert(pos, frag);
};

class AddSubpageCommand extends UICommand {
  isEnabled = (state: EditorState): boolean => {
    // check the node exists in the schema
    const nodeType = state.schema.nodes[SUBPAGE];
    if (!nodeType) return false;

    // enable the command only if the selection is empty
    const { selection } = state.tr;
    if (selection instanceof TextSelection) return selection.from === selection.to;

    return false;
  };

  execute = (state: EditorState, dispatch?: (tr: Transaction) => void, _view?: EditorView | null): boolean => {
    const { tr, selection } = state;

    const nodeType = state.schema.nodes[SUBPAGE];
    const { createInlineDoc, setSubpageDocID } = getCustomState(state);

    // check again selection is empty
    if (selection instanceof TextSelection && selection.from !== selection.to) return false;
    if (!(nodeType && dispatch && createInlineDoc && setSubpageDocID)) return false;

    const createDoc = async () => {
      const [docID] = await createInlineDoc(START_TITLE);
      createSubpageNode(tr, docID, selection.from - 1, nodeType);
      setSubpageDocID(docID); // flush save current doc and navigate to new document
      dispatch(tr); // insert the node to the document
    };

    void createDoc();

    return true;
  };
}

export default AddSubpageCommand;
