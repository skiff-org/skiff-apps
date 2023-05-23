import '../ui/DocTitle.css';

import { EditorState, Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import ReactDOM from 'react-dom';

import { DOC_TITLE } from '../NodeNames';
import { DOC_TITLE_INDEX } from '../schema/specs/DocTitleNodeSpec';

const addTitlePlaceholder = (state: EditorState, placeholdersSet: Decoration[], docTitlePlaceholder: string) => {
  const docTitleNode = state.doc.child(DOC_TITLE_INDEX);
  if (!docTitleNode || docTitleNode.type.name !== DOC_TITLE) {
    return;
  }

  if (!docTitleNode.textContent) {
    placeholdersSet.push(
      Decoration.node(DOC_TITLE_INDEX, DOC_TITLE_INDEX + docTitleNode.nodeSize, {
        'data-placeholder': docTitlePlaceholder
      })
    );
  }
};

// This plugin adding place-holders for title node (in the future description node)
export const docPlaceholders = (
  docTitlePlaceholder: string
) =>
  new Plugin({
    props: {
      decorations: (state) => {
        const placeholders: Decoration[] = [];

        addTitlePlaceholder(state, placeholders, docTitlePlaceholder);

        return DecorationSet.create(state.doc, placeholders);
      }
    }
  });
