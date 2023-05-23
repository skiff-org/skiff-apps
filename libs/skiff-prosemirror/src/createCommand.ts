import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import UICommand from './ui/UICommand';

type ExecuteCall = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView | null) => boolean;
export default function createCommand(execute: ExecuteCall): UICommand {
  class CustomCommand extends UICommand {
    isEnabled = (state: EditorState): boolean => this.execute(state);

    execute = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView | null): boolean => {
      const { tr } = state;
      let endTr = tr;
      execute(
        state,
        (nextTr) => {
          endTr = nextTr;
          dispatch?.(endTr);
        },
        view
      );
      return endTr.docChanged || tr !== endTr;
    };
  }

  return new CustomCommand();
}
