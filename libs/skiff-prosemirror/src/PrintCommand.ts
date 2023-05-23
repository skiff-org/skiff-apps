import { EditorState, Transaction } from 'prosemirror-state';

import UICommand from './ui/UICommand';

class PrintCommand extends UICommand {
  isActive = (): boolean => false;

  isEnabled = (): boolean => !!window.print;

  execute = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    if (dispatch && window.print) {
      window.print();
      return true;
    }

    return false;
  };
}

export default PrintCommand;
