import isEqual from 'lodash/isEqual';
import { Fragment, Node } from 'prosemirror-model';
import { Plugin, PluginKey } from 'prosemirror-state';
import { NodeWithPos } from 'prosemirror-utils';

import { EditorSchema, syncPluginKey } from '..';
import { DOC_HEADER_HR, SUBPAGE } from '../NodeNames';
import uuid from '../ui/uuid';

export const stopPreventRemoveSubpage = 'prevent-remove-of-subpage';
export const updateChildDocuments = 'update-child-documents';

/**
 * search for all the subpage nodes in the document
 */
export const getAllSubpages = (node: Fragment) => {
  const subpagesNodes: NodeWithPos[] = [];
  node.descendants((child, pos) => {
    //unshift instead of push so the delete will be from the start of the doc
    if (child.type.name === EditorSchema.nodes[SUBPAGE].name) subpagesNodes.unshift({ node: child, pos });
  });
  return subpagesNodes;
};

export type SubpagePluginAttrs = {
  currentSyncedArray: string[];
};

/**
 * return missing and extra subpage nodes in document by the current document children ids
 * @param doc current document
 * @param documentChildren document children IDs
 * @returns [missing subpages IDs, extra subpage nodes in document]
 */
const getMissingSubpages = (doc: Node, documentChildren: string[]): [string[], NodeWithPos[]] => {
  const allDocumentSubpages = getAllSubpages(doc.content);
  const missingNodes = [];

  for (const neededSubpage of documentChildren) {
    const documentNodeIndex = allDocumentSubpages.findIndex(({ node }) => node.attrs.docID === neededSubpage);
    if (documentNodeIndex < 0) missingNodes.push(neededSubpage);
    else allDocumentSubpages.splice(documentNodeIndex, 1);
  }

  return [missingNodes, allDocumentSubpages];
};

export const subpagePluginKey = new PluginKey<SubpagePluginAttrs>('subpage-plugin');

/**
 * this plugin doe 2 things:
 *
 * 1. prevent a remove of subpage nodes
 * 2. updates the subpages in the document by the current document children ids
 */
export class SubpagePlugin extends Plugin<SubpagePluginAttrs> {
  constructor() {
    super({
      key: subpagePluginKey,
      // filter transactions that remove / add subpages
      filterTransaction: (transaction, state) => {
        // meta for disabling the filter
        if (transaction.getMeta(stopPreventRemoveSubpage) === true) return true;

        // if page is not synced yet disable filter (initial load)
        if (!syncPluginKey.getState(state)?.synced) return true;

        // if transition is from the y-prosemirror disable filter
        if (transaction.getMeta('y-sync$') !== undefined) return true;

        // the doc has not changed - no need to verify
        if (!transaction.docChanged) return true;

        const oldSubpagesIds = getAllSubpages(transaction.docs[0].content).map(({ node }) => node.attrs.docID);
        const newSubPagesIds = getAllSubpages(transaction.doc.content).map(({ node }) => node.attrs.docID);

        // sort so you can drag and drop (order dont matter)
        const allowed = isEqual(oldSubpagesIds.sort(), newSubPagesIds.sort());
        return allowed;
      },
      // transaction to update the subpages in teh document
      appendTransaction: (transaction, _oldState, newState) => {
        // check for childDocuments update
        let newChildDocuments;
        transaction.forEach((tr) => {
          newChildDocuments = tr.getMeta(updateChildDocuments);
        });
        if (newChildDocuments === undefined) return;

        const [missingSubpagesIds, extraNodes] = getMissingSubpages(newState.doc, newChildDocuments);

        const { tr } = newState;

        // remove all extra nodes
        if (extraNodes.length > 0) {
          extraNodes.forEach((extraNode) => {
            tr.delete(extraNode.pos, extraNode.pos + extraNode.node.nodeSize);
          });
        }

        // add missing nodes
        if (missingSubpagesIds.length > 0) {
          const newSubpageNodes = missingSubpagesIds.map((docID) =>
            EditorSchema.nodes[SUBPAGE].create({ docID, nodeID: uuid() })
          );

          let insertLocation = -1;
          newState.doc.descendants((node, pos) => {
            if (node.type.name === DOC_HEADER_HR) insertLocation = pos + node.nodeSize;
            return true;
          });
          // Only insert if the doc has HEADER_HR which means its a new doc type
          if (insertLocation > 0) tr.insert(insertLocation, newSubpageNodes);
        }

        tr.setMeta(stopPreventRemoveSubpage, true);
        // remove update from Ctrl-Z history
        tr.setMeta('addToHistory', false);

        return tr;
      }
    });
  }
}
