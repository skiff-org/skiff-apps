import { Plugin, PluginKey } from 'prosemirror-state';

import { EditorSchema } from '..';
import { DOC_TITLE } from '../NodeNames';
import { DOC_TITLE_INDEX } from '../schema/specs/DocTitleNodeSpec';

export const updateDocumentTitle = 'update-document-title';
export const titleSyncPluginKey = new PluginKey('title-sync-plugin');

export class TitleSyncPlugin extends Plugin {
  constructor() {
    super({
      key: titleSyncPluginKey,
      appendTransaction: (transaction, _oldState, newState) => {
        let newTitle;
        transaction.forEach((tr) => {
          newTitle = tr.getMeta(updateDocumentTitle);
        });

        if (newTitle === undefined) return;

        const { tr } = newState;

        const docTitleNode = newState.doc.child(DOC_TITLE_INDEX);
        const docTitlePos = newState.doc.resolve(0).posAtIndex(DOC_TITLE_INDEX);

        if (docTitleNode.textContent === newTitle) return;

        const newTitleNode = EditorSchema.nodes[DOC_TITLE].createAndFill({}, [EditorSchema.text(newTitle)]);
        if (!newTitleNode) return;

        tr.replaceRangeWith(docTitlePos, docTitleNode.nodeSize + docTitlePos, newTitleNode);

        return tr;
      }
    });
  }
}
