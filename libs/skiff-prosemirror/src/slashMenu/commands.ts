import { Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import {
  CODE,
  EM,
  H1,
  H2,
  H3,
  H4,
  HR,
  MATH_INSERT,
  OL,
  STRONG,
  SUB_PAGE,
  TABLE_INSERT_TABLE,
  TEXT_COLOR,
  TEXT_HIGHLIGHT,
  TO_DO,
  TOGGLE_LIST_INSERT,
  UL
} from '../EditorCommands';
import FontTypeCommand from '../FontTypeCommand';

import { MetaTypes, slashMenuKey, SubMenuTypes } from './InterfacesAndEnums';

// Closes the menu without insrting any text
export const cancelSlashMenu = (view: EditorView) => {
  const newTr: Transaction = view.state.tr.setMeta(slashMenuKey, {
    type: MetaTypes.close
  });
  view.dispatch(newTr);
};

// Closes the menu with inserting a forward slash
export const closeSlashMenu = (view: EditorView) => {
  const newTr: Transaction = view.state.tr
    .setMeta(slashMenuKey, {
      type: MetaTypes.close
    })
    .insertText('/', view.state.selection.from);

  view.dispatch(newTr);
};

// closes the sub menu and opens the main menu
export const closeSubMenu = (view: EditorView) => {
  const newTr: Transaction = view.state.tr.setMeta(slashMenuKey, {
    type: MetaTypes.closeSubMenu
  });
  view.dispatch(newTr);
};

/**
 * Dispatches the transaction to open the appropriate sub menu
 * @param view{EditorView}
 * @param subMenu{SubMenuTypes} The type of menu to be opened
 * @param withoutFilter{boolean} If true then the plugin resets the filter, used when we want to start a new search in the sub menu eg.: color menus
 */
export const openSubMenu = (view: EditorView, subMenu: SubMenuTypes, withoutFilter?: boolean) => {
  view.focus();
  const newTr: Transaction = view.state.tr.setMeta(slashMenuKey, {
    type: MetaTypes.openSubMenu,
    value: subMenu,
    withoutFilter
  });
  view.dispatch(newTr);
};

// Returns a transaction with the meta set to close the menu for editor commands to use as a base transaction
export const getCloseMenuAfterCommandTransaction = (view: EditorView) => {
  const newTr: Transaction = view.state.tr.setMeta(slashMenuKey, {
    type: MetaTypes.close
  });
  return newTr;
};

// Closes the menu and inserts the filter text into the editor
export const insertAfterNoMatchCommand = (view: EditorView, char = '') => {
  const menuState = slashMenuKey.getState(view.state);

  const newTr: Transaction = view.state.tr.setMeta(slashMenuKey, {
    type: MetaTypes.close
  });
  newTr.insertText(menuState?.filter + char);
  view.dispatch(newTr);
};

export const subpageCommand = (view: EditorView) => {
  const tr = getCloseMenuAfterCommandTransaction(view);
  view.dispatch(tr);
  SUB_PAGE.execute(view.state, view.dispatch, view);
};

export const latexCommand = (view: EditorView) => {
  MATH_INSERT.execute(view.state, view.dispatch);
};

export const orderedListCommand = (view: EditorView) => {
  // list toggle command handles the closing of the menu
  OL.execute(view.state, view.dispatch, view);
};

export const unorderedListCommand = (view: EditorView) => {
  // list toggle command handles the closing of the menus
  UL.execute(view.state, view.dispatch, view);
};
export const todoListCommand = (view: EditorView) => {
  // list toggle command handles the closing of the menu
  TO_DO.execute(view.state, view.dispatch, view);
};

export const toggleListCommand = (view: EditorView) => {
  // list toggle command handles the closing of the menus
  TOGGLE_LIST_INSERT.execute(view.state, view.dispatch, view);
};

export const insertTableCommand = (view: EditorView) => {
  TABLE_INSERT_TABLE.execute(view.state, view.dispatch, view, null);
};

export const boldCommand = (view: EditorView) => {
  const tr = getCloseMenuAfterCommandTransaction(view);
  view.dispatch(tr);
  // TODO Aaron 2021/10/12 STRONG command does not dispatch a transaction on its own, we need to dispatch here, removing setTime would be ideal
  // SRONG.execute does not dispatch a transaction so we can dispatch for closing here
  setTimeout(() => STRONG.execute(view.state, view.dispatch, view), 0);
  view.focus();
};

export const italicCommand = (view: EditorView) => {
  const tr = getCloseMenuAfterCommandTransaction(view);
  view.dispatch(tr);
  // TODO Aaron 2021/10/12 EM command does not dispatch a transaction on its own, we need to dispatch here, removing setTime would be ideal
  // EM.execute does not dispatch a transaction so we can dispatch for closing here
  setTimeout(() => EM.execute(view.state, view.dispatch, view), 0);
  view.focus();
};

export const horizontalRuleCommand = (view: EditorView) => {
  HR.execute(view.state, view.dispatch, view, null);
};

export const insertCodeBlocksCommand = (view: EditorView) => {
  CODE.execute(view.state, view.dispatch, view);
  view.focus();
};
export const changeTextColorCommand = (view: EditorView, color: string) => {
  TEXT_COLOR.executeWithUserInput(view.state, view.dispatch, view, color);
  view.focus();
};
export const changeHighLightColorCommand = (view: EditorView, color: string) => {
  TEXT_HIGHLIGHT.executeWithUserInput(view.state, view.dispatch, view, color);
  view.focus();
};
export const changeFontTypeCommand = (view: EditorView, name: string) => {
  new FontTypeCommand(name, '').execute(view.state, view.dispatch, view);
  view.focus();
};

export const headerCommands = {
  H1: (view: EditorView) => {
    H1.execute(view.state, view.dispatch, view);
  },
  H2: (view: EditorView) => {
    H2.execute(view.state, view.dispatch, view);
  },
  H3: (view: EditorView) => {
    H3.execute(view.state, view.dispatch, view);
  },
  H4: (view: EditorView) => {
    H4.execute(view.state, view.dispatch, view);
  }
};
