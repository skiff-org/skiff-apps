// Source: https://discuss.prosemirror.net/t/keeping-selection-while-using-the-menu-or-clicking-outside-the-document/578
import { NodeSelection, Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

const SelectPlugin = new Plugin({
  state: {
    init() {
      return {
        deco: DecorationSet.empty
      };
    },

    apply(transaction, state, prevEditorState, editorState) {
      if ((transaction.docChanged || transaction.selectionSet) && !(transaction.selection instanceof NodeSelection)) {
        const decos = [
          Decoration.inline(transaction.selection.from, transaction.selection.to, {
            class: 'selection-marker'
          })
        ];
        const deco = DecorationSet.create(editorState.doc, decos);
        return {
          deco
        };
      }

      return state;
    }
  },
  props: {
    decorations(state) {
      if (state && this.getState(state)) {
        return this.getState(state).deco;
      }

      return null;
    }
  }
});
export default SelectPlugin;
