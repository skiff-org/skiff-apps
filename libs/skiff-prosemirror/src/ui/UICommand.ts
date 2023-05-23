import { EditorState, Selection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { isSelectionInNonLinkableNodes } from '../inputRules/linkRules';

export type IsActiveCall = (state: EditorState) => boolean;
export type FindNodeTypeInSelectionCall = (selection: Selection) => Record<string, any>;
const EventType = {
  CLICK: 'mouseup',
  MOUSEENTER: 'mouseenter'
};

function dryRunEditorStateProxyGetter(state: EditorState, propKey: string): any {
  const val = state[propKey];

  if (propKey === 'tr' && val instanceof Transaction) {
    return val.setMeta('dryrun', true);
  }

  return val;
}

function dryRunEditorStateProxySetter(state: EditorState, propKey: string, propValue: any): boolean {
  state[propKey] = propValue;
  // Indicate success
  return true;
}

class UICommand {
  static EventType = EventType;

  shouldRespondToUIEvent = (e: React.SyntheticEvent | MouseEvent): boolean => e.type === UICommand.EventType.CLICK;

  renderLabel = (state: EditorState): any => null;

  isActive = (state: EditorState, ...args: any): boolean => false; // we add args so different commands can pass relevant props to the method

  isEnabled = (state: EditorState, view?: EditorView | null): boolean => {
    try {
      return this.dryRun(state, view);
    } catch (error) {
      return false;
    }
  };

  dryRun = (state: EditorState, view?: EditorView | null): boolean => {
    const { Proxy } = window;
    const dryRunState = Proxy
      ? new Proxy(state, {
          get: dryRunEditorStateProxyGetter,
          set: dryRunEditorStateProxySetter
        })
      : state;
    return this.execute(dryRunState, undefined, view);
  };

  execute = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView | null,
    event?: React.SyntheticEvent | null
  ): boolean => {
    if (isSelectionInNonLinkableNodes(state.selection)) return false;
    this.waitForUserInput(state, dispatch, view, event)
      .then((inputs) => {
        this.executeWithUserInput(state, dispatch, view, inputs);
      })
      .catch((error) => {
        console.error(error);
      });
    return false;
  };

  waitForUserInput = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView | null,
    event?: React.SyntheticEvent | null
  ): Promise<any> => Promise.resolve(undefined);

  executeWithUserInput = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView | null,
    inputs?: any
  ): boolean => false;

  cancel(): void {
    // subclass should overwrite this.
  }
}

export default UICommand;
