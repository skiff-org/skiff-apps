import { EditorState } from 'prosemirror-state';
import { findParentNodeOfTypeClosestToPos } from 'prosemirror-utils';

import { TOGGLE_ITEM_TITLE } from '../NodeNames';

import {
  defaultHeaderItems,
  defaultMainMenuItems,
  getDefaultFontItems,
  getDefaultHighlightColorItems,
  getDefaultTextColorItems
} from './defaultItems';
import { FilteredMenuItems, MenuItem, MenuItemNamesIds, SlashMenuState, SubMenuTypes } from './InterfacesAndEnums';

/**
 * Handles the cases when we want to automatically open or close a sub menu without the user explicitly choosing it with enter/tab
 * @param state{SlashMenuState}
 * @param items{FilteredMenuItems} the items remaining in the list after filtering
 */
export const getOpenedMenu = (state: SlashMenuState, items: FilteredMenuItems) => {
  const alreadyOpenedMenu = state.openedMenuType;
  // When the heading item is the only one remaining in the main menu, we automatically open it
  if (
    alreadyOpenedMenu === SubMenuTypes.MAIN_MENU &&
    items.mainMenuItems.length === 1 &&
    items.mainMenuItems[0].id === MenuItemNamesIds.HEADING
  ) {
    return SubMenuTypes.HEADING_MENU;
  }
  // When only one letter remains in the filter and heading is open we go back to main menu
  if (alreadyOpenedMenu === SubMenuTypes.HEADING_MENU && state.filter.length === 1) {
    return SubMenuTypes.MAIN_MENU;
  }
  return alreadyOpenedMenu;
};

/**
 * Returns true if there are any options left in the currently opened menu
 * @param items{FilteredMenuItems} Items remaining in the menu state after filtering
 * @param openedMenu{SubMenuTypes}
 */
export const getAreThereOptions = (items: FilteredMenuItems, openedMenu: SubMenuTypes) => {
  const retValues = {
    [SubMenuTypes.MAIN_MENU]: () => items.mainMenuItems.length !== 0,
    [SubMenuTypes.HEADING_MENU]: () => items.headerItems.length !== 0,
    [SubMenuTypes.TEXT_COLOR_MENU]: () => items.textColorItems.length !== 0,
    [SubMenuTypes.HIGHLIGHT_MENU]: () => items.highlightColorItems.length !== 0,
    [SubMenuTypes.FONT_TYPE_MENU]: () => items.fontTypeItems.length !== 0
  };
  return retValues[openedMenu]() || false;
};

/**
 * Returns true if the slash menu should change the selected option to 0
 * For eg.: item 5 is selected but after user input only 4 item is available
 * @param openedMenuType{SubMenuTypes}
 * @param state{SlashMenuState}
 */
export const slashMenuShouldChangeSelected = (openedMenuType: SubMenuTypes, state: SlashMenuState) => {
  if (openedMenuType !== state.openedMenuType) {
    return true;
  }
  // selected is Array index so we add 1
  const selected = state.selectedOption + 1;
  const retValues = {
    [SubMenuTypes.MAIN_MENU]: () => selected < state.mainMenuItems.length,
    [SubMenuTypes.HEADING_MENU]: () => selected < state.headerItems.length,
    [SubMenuTypes.TEXT_COLOR_MENU]: () => selected < state.textColorItems.length,
    [SubMenuTypes.HIGHLIGHT_MENU]: () => selected < state.highLightColorItems.length,
    [SubMenuTypes.FONT_TYPE_MENU]: () => selected < state.fontTypeItems.length
  };
  return retValues[openedMenuType]() || true;
};

/**
 * When the user selects an item with arrow keys, this function sets the classes of the menu items to reflect the change
 * @param itemArray{Array<MenuItem>} currently showed items in menu
 * @param selectedItem{MenuItem}
 */
export const setMenuItemClasses = (itemArray: Array<MenuItem>, selectedItem: MenuItem) => {
  itemArray.forEach((item: MenuItem) => {
    const element = document.getElementById(item.id);

    if (element instanceof HTMLElement) {
      element.className = 'skiff-editor-menu-item';
    }
  });
  const element = document.getElementById(selectedItem.id);

  if (element instanceof HTMLElement) {
    element.className = 'skiff-editor-menu-selected-item';
  }
};

/**
 * Returns the main menu items which have a currently enabled command
 * @param state{EditorState}
 * */
export const getEnabledMenuItems = (state: EditorState) => defaultMainMenuItems.filter((item) => item.enabled(state));

/**
 * Returns the header menu items which have a currently enabled command
 * @param state{EditorState}
 * */
export const getEnabledHeaderItems = (state: EditorState) => defaultHeaderItems.filter((item) => item.enabled(state));

/**
 * Returns the item that is currently selected with arrow keys
 * @param slashMenuProps{SlashMenuState}
 */
export const getSelectedItem = (slashMenuProps: SlashMenuState): MenuItem => {
  const {
    openedMenuType,
    areThereOptions,
    selectedOption,
    mainMenuItems,
    headerItems,
    textColorItems,
    highLightColorItems,
    fontTypeItems,
    noMatchItems
  } = slashMenuProps;
  if (!areThereOptions) {
    return noMatchItems[selectedOption];
  }

  const retValues = {
    [SubMenuTypes.MAIN_MENU]: () => mainMenuItems[selectedOption],
    [SubMenuTypes.HEADING_MENU]: () => headerItems[selectedOption],
    [SubMenuTypes.TEXT_COLOR_MENU]: () => textColorItems[selectedOption],
    [SubMenuTypes.HIGHLIGHT_MENU]: () => highLightColorItems[selectedOption],
    [SubMenuTypes.FONT_TYPE_MENU]: () => fontTypeItems[selectedOption]
  };

  return retValues[openedMenuType]();
};

/**
 * Returns the menu type associated with the Main menu item
 * @param{string} id of the menu item
 */
export const menuToBeOpened = (id: string) => {
  const cases = {
    [MenuItemNamesIds.HEADING]: SubMenuTypes.HEADING_MENU,
    [MenuItemNamesIds.COLOR_TEXT]: SubMenuTypes.TEXT_COLOR_MENU,
    [MenuItemNamesIds.COLOR_HIGHLIGHT]: SubMenuTypes.HIGHLIGHT_MENU,
    [MenuItemNamesIds.FONT_TYPE]: SubMenuTypes.FONT_TYPE_MENU
  };
  return cases[id] || SubMenuTypes.MAIN_MENU;
};

/**
 * Depending in the filter in the state, creates a regex and filters the items shown in the slash menu
 * @param state{SlashMenuState}
 * @param filter{string} the user input we are filtering with
 * @param editorState{EditorState}
 * @returns FilteredMenuItems
 */
export const autoCompleteFilter = (
  state: SlashMenuState,
  filter: string,
  editorState: EditorState
): FilteredMenuItems => {
  const regExp = new RegExp(`${filter.toUpperCase().replace(/\s/g, '\\s')}`);
  const newHeaderItems = getEnabledHeaderItems(editorState).filter(
    (item) => item.label.toUpperCase().match(regExp) !== null
  );
  const newMenuItems = getEnabledMenuItems(editorState).filter(
    (item) => item.label.toUpperCase().match(regExp) !== null
  );
  const newTextColorItems = getDefaultTextColorItems().filter(
    (item) => item.label.toUpperCase().match(regExp) !== null
  );
  const newHighlightColorItems = getDefaultHighlightColorItems().filter(
    (item) => item.label.toUpperCase().match(regExp) !== null
  );
  const newFontTypeItems = getDefaultFontItems().filter((item) => item.label.toUpperCase().match(regExp) !== null);
  return {
    mainMenuItems: newMenuItems,
    headerItems: newHeaderItems,
    textColorItems: newTextColorItems,
    highlightColorItems: newHighlightColorItems,
    fontTypeItems: newFontTypeItems
  };
};

// Object to store the menu items that we want to open with arrows
export const menusThatOpenWithArrow = {
  [MenuItemNamesIds.HEADING]: 1,
  [MenuItemNamesIds.COLOR_TEXT]: 2,
  [MenuItemNamesIds.COLOR_HIGHLIGHT]: 3,
  [MenuItemNamesIds.FONT_TYPE]: 4
};

// Object to store the sub menus that we want to close with arrows
export const menusThatCloseWithArrow = {
  [SubMenuTypes.HEADING_MENU]: 1,
  [SubMenuTypes.TEXT_COLOR_MENU]: 2,
  [SubMenuTypes.HIGHLIGHT_MENU]: 3,
  [SubMenuTypes.FONT_TYPE_MENU]: 4
};

// https://devstephen.medium.com/keyboardevent-key-for-cross-browser-key-press-check-61dbad0a067a#:~:text=KeyboardEvent.code%20is,good%20for%20international)
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
export const slashKeyPressed = (event: KeyboardEvent) => event.key === '/';

const FORBIDDEN_NODES = [TOGGLE_ITEM_TITLE];

export const slashPressInForbiddenNode = (state: EditorState) =>
  FORBIDDEN_NODES.some(
    (nodeName) => !!findParentNodeOfTypeClosestToPos(state.selection.$from, state.schema.nodes[nodeName])
  );
