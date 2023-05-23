import { Plugin, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { mentionsKey } from '../mentionsMenu/utils';
import supportedMenuKeys from '../sharedMenuComponents/supportedMenuKeys';

import { cancelSlashMenu, closeSlashMenu, closeSubMenu, insertAfterNoMatchCommand } from './commands';
import {
  defaultHeaderItems,
  getDefaultFontItems,
  getDefaultHighlightColorItems,
  getDefaultTextColorItems,
  noMatchItems
} from './defaultItems';
import { MetaTypes, slashMenuKey, SlashMenuState, SubMenuTypes } from './InterfacesAndEnums';
import {
  autoCompleteFilter,
  getAreThereOptions,
  getEnabledHeaderItems,
  getEnabledMenuItems,
  getOpenedMenu,
  getSelectedItem,
  menusThatCloseWithArrow,
  menusThatOpenWithArrow,
  menuToBeOpened,
  slashKeyPressed,
  slashMenuShouldChangeSelected,
  slashPressInForbiddenNode
} from './utils';
/**
 * Handles the user typing into slash menu
 * @param view{EditorView}
 * @param key{string} Key attribute of the keypress event
 * */
export const updateInput = (view: EditorView, key: string) => {
  const menuState = slashMenuKey.getState(view.state);
  if (key === ' ') {
    insertAfterNoMatchCommand(view, key);
    return false;
  }
  // the maximum characters fitting in slash menu is 19, above that we automatically insert the text and return with false
  if (menuState && menuState.filter.length > 18) {
    insertAfterNoMatchCommand(view, key);
    return false;
  }
  const newTr: Transaction = view.state.tr.setMeta(slashMenuKey, {
    type: MetaTypes.inputChange,
    newChar: key
  });
  view.dispatch(newTr);
  return true;
};

/**
 * State of the plugin contains the MenuItems which it can execute,
 * whether it or its submenu is open,
 * the proseMirror position it should appear in,
 * and the position of the item that is currently selected by keyboard
 * The handleKeyDown prop handles the keyboard inputs and desired behaviour
 */
const SlashMenuPlugin = new Plugin<SlashMenuState>({
  key: slashMenuKey,
  state: {
    init(config, instance) {
      return {
        mainMenuItems: getEnabledMenuItems(instance),
        headerItems: getEnabledHeaderItems(instance),
        textColorItems: getDefaultTextColorItems(),
        highLightColorItems: getDefaultHighlightColorItems(),
        fontTypeItems: getDefaultFontItems(),
        noMatchItems,
        areThereOptions: true,
        position: 1,
        selectedOption: 0,
        open: false,
        openedMenuType: SubMenuTypes.MAIN_MENU,
        filter: ''
      };
    },

    apply(transaction, state, prevEditorState, editorState) {
      const meta = transaction.getMeta(slashMenuKey);
      const position = transaction.mapping.map(state.position);
      // this handles the click outside of the menu
      if (transaction.selectionSet && transaction.steps.length === 0) {
        return {
          ...state,
          open: false
        };
      }

      if (meta) {
        const {
          open,
          selectedOption,
          areThereOptions,
          noMatchItems,
          mainMenuItems,
          highLightColorItems,
          headerItems,
          textColorItems,
          fontTypeItems,
          openedMenuType,
          filter
        } = state;
        switch (meta.type) {
          case MetaTypes.open:
            return {
              ...state,
              position: editorState.selection.from - 1,
              areThereOptions: true,
              open: true,
              openedMenuType: SubMenuTypes.MAIN_MENU,
              mainMenuItems: getEnabledMenuItems(editorState),
              headerItems: getEnabledHeaderItems(editorState),
              textColorItems: getDefaultTextColorItems(),
              highLightColorItems: getDefaultHighlightColorItems(),
              fontTypeItems: getDefaultFontItems(),
              selectedOption: 0,
              filter: ''
            };
          case MetaTypes.close:
            return {
              ...state,
              position: editorState.selection.from - 1,
              open: false,
              openedMenuType: SubMenuTypes.MAIN_MENU,
              mainMenuItems: getEnabledMenuItems(editorState),
              headerItems: getEnabledHeaderItems(editorState),
              textColorItems: getDefaultTextColorItems(),
              highLightColorItems: getDefaultHighlightColorItems(),
              fontTypeItems: getDefaultFontItems(),
              selectedOption: 0,
              filter: ''
            };

          case MetaTypes.openSubMenu: {
            const { withoutFilter } = meta;
            return {
              ...state,
              openedMenuType: meta.value,
              selectedOption: 0,
              filter: withoutFilter ? '' : filter,
              headerItems: withoutFilter ? defaultHeaderItems : headerItems,
              textColorItems: withoutFilter ? getDefaultTextColorItems() : textColorItems,
              highLightColorItems: withoutFilter ? getDefaultHighlightColorItems() : highLightColorItems,
              fontTypeItems: withoutFilter ? getDefaultFontItems() : fontTypeItems
            };
          }

          case MetaTypes.closeSubMenu:
            return {
              ...state,
              openedMenuType: SubMenuTypes.MAIN_MENU,
              selectedOption: 0,
              mainMenuItems: getEnabledMenuItems(editorState),
              headerItems: getEnabledHeaderItems(editorState),
              textColorItems: getDefaultTextColorItems(),
              highLightColorItems: getDefaultHighlightColorItems(),
              fontTypeItems: getDefaultFontItems(),
              filter: ''
            };

          // if a certain menu is open and the selection is not the last item in that menu we increase the selected index
          case MetaTypes.stepUp:
            if (open) {
              // case of some items in some menu are available
              if (!areThereOptions && selectedOption + 1 < noMatchItems.length) {
                return {
                  ...state,
                  selectedOption: selectedOption + 1
                };
              }

              const cases = {
                [SubMenuTypes.MAIN_MENU]: () => selectedOption + 1 < mainMenuItems.length,
                [SubMenuTypes.HEADING_MENU]: () => selectedOption + 1 < headerItems.length,
                [SubMenuTypes.TEXT_COLOR_MENU]: () => selectedOption + 1 < textColorItems.length,
                [SubMenuTypes.HIGHLIGHT_MENU]: () => selectedOption + 1 < highLightColorItems.length,
                [SubMenuTypes.FONT_TYPE_MENU]: () => selectedOption + 1 < fontTypeItems.length
              };
              if (areThereOptions && cases[openedMenuType]()) {
                return { ...state, selectedOption: selectedOption + 1 };
              }
            }
            break;

          case MetaTypes.stepDown:
            // if the selected option is not 0 we can decrease it
            if (open && selectedOption > 0) {
              return {
                ...state,
                selectedOption: selectedOption - 1
              };
            }
            break;

          // When slash menu is open, the states filter attribute stores the string the user is searching for and is shown back to the user, with every keypress we add the new character for the filter
          // When backspace is pressed we remove the last character from filter, or we close the menu when filter length is 0
          case MetaTypes.inputChange:
            if (open) {
              if (meta.newChar === 'Backspace') {
                if (state.filter.length > 0) {
                  // Since we press backspace slice(0,-1) deletes the last character of the filter string we are filtering for
                  const newFilter = state.filter.slice(0, -1);
                  const newItems = autoCompleteFilter(state, newFilter, editorState);
                  // newOpenedMenuType is not always different from the current one
                  const newOpenedMenuType = getOpenedMenu(state, newItems);
                  const areThereOptions = getAreThereOptions(newItems, newOpenedMenuType);
                  const shouldChangeSelected = slashMenuShouldChangeSelected(newOpenedMenuType, state);
                  return {
                    ...state,
                    openedMenuType: newOpenedMenuType,
                    areThereOptions,
                    selectedOption: shouldChangeSelected ? 0 : selectedOption,
                    mainMenuItems: newItems.mainMenuItems,
                    headerItems: newItems.headerItems,
                    textColorItems: newItems.textColorItems,
                    highLightColorItems: newItems.highlightColorItems,
                    fontTypeItems: newItems.fontTypeItems,
                    filter: newFilter
                  };
                }

                if (state.filter.length === 0) {
                  if (state.openedMenuType === SubMenuTypes.MAIN_MENU) {
                    // Closing the menu
                    return {
                      ...state,
                      open: false
                    };
                  }
                  // Closing the subMenu
                  return {
                    ...state,
                    openedMenuType: SubMenuTypes.MAIN_MENU,
                    selectedOption: 0,
                    mainMenuItems: getEnabledMenuItems(editorState),
                    headerItems: getEnabledHeaderItems(editorState),
                    textColorItems: getDefaultTextColorItems(),
                    highLightColorItems: getDefaultHighlightColorItems(),
                    fontTypeItems: getDefaultFontItems()
                  };
                }
              }

              const updatedFilter = filter + meta.newChar;
              const newItems = autoCompleteFilter(state, updatedFilter, editorState);
              // newOpenedMenuType is not always different from the current one
              const newOpenedMenuType = getOpenedMenu(state, newItems);
              const areThereOptions = getAreThereOptions(newItems, newOpenedMenuType);
              const shouldChangeSelected = slashMenuShouldChangeSelected(newOpenedMenuType, state);
              return {
                ...state,
                openedMenuType: newOpenedMenuType,
                areThereOptions,
                selectedOption: shouldChangeSelected ? 0 : state.selectedOption,
                mainMenuItems: newItems.mainMenuItems,
                headerItems: newItems.headerItems,
                textColorItems: newItems.textColorItems,
                highLightColorItems: newItems.highlightColorItems,
                fontTypeItems: newItems.fontTypeItems,
                filter: updatedFilter
              };
            }
            break;
          default:
            return state;
        }
      }

      return state.position === position
        ? state
        : {
            ...state,
            position
          };
    }
  },
  props: {
    handleKeyDown(view, event) {
      const editorState = view.state;
      const state = slashMenuKey.getState(editorState);
      if (!(state !== null && state !== undefined)) return false;
      const mentionMenuOpen = mentionsKey.getState(view.state)?.open;

      const { open } = state;
      const selectedItem = getSelectedItem(state);
      if (supportedMenuKeys[event.key] && state.open) {
        updateInput(view, event.key);
        return true;
      }

      if (!open && slashKeyPressed(event) && !mentionMenuOpen && !slashPressInForbiddenNode(editorState)) {
        const posInLine = editorState.selection.$head.parentOffset;
        const lastChar = editorState.selection.$head.parent.textContent.slice(posInLine - 1, posInLine);
        // We only want to open the menu if the slash comes after a whitespace (HSP), tab or is in an empty row
        const shouldOpen = lastChar === ' ' || lastChar === '' || lastChar === ' ';
        if (!shouldOpen) {
          return false;
        }
        const newTr: Transaction = editorState.tr.setMeta(slashMenuKey, {
          type: MetaTypes.open
        });
        view.dispatch(newTr);
        return true;
      }
      if (open) {
        if (slashKeyPressed(event) && state.filter.length === 0) {
          closeSlashMenu(view);
          return true;
        }

        if (event.code === 'ArrowDown') {
          const newTr: Transaction = editorState.tr.setMeta(slashMenuKey, {
            type: MetaTypes.stepUp
          });
          view.dispatch(newTr);
          return true;
        }

        if (event.code === 'ArrowUp') {
          const newTr: Transaction = editorState.tr.setMeta(slashMenuKey, {
            type: MetaTypes.stepDown
          });
          view.dispatch(newTr);
          return true;
        }

        if (event.code === 'ArrowRight' && menusThatOpenWithArrow[selectedItem.id]) {
          const newTr: Transaction = view.state.tr.setMeta(slashMenuKey, {
            type: MetaTypes.openSubMenu,
            withoutFilter: true,
            value: menuToBeOpened(selectedItem.id)
          });
          view.dispatch(newTr);
          return true;
        }
        if (event.code === 'ArrowLeft' && menusThatCloseWithArrow[state.openedMenuType]) {
          const newTr: Transaction = view.state.tr.setMeta(slashMenuKey, {
            type: MetaTypes.closeSubMenu
          });
          view.dispatch(newTr);
          return true;
        }

        if (event.code === 'Enter' || event.code === 'NumpadEnter' || event.code === 'Tab') {
          if (selectedItem) {
            selectedItem.command(view);
          }

          return true;
        }

        if (event.code === 'Escape' && state.openedMenuType === SubMenuTypes.MAIN_MENU) {
          cancelSlashMenu(view);
          return true;
        }

        if (event.code === 'Escape' && state.openedMenuType !== SubMenuTypes.MAIN_MENU) {
          closeSubMenu(view);
          return true;
        }
      }

      if (supportedMenuKeys[event.key] && state.open) {
        updateInput(view, event.key);
        return true;
      }

      return false;
    }
  }
});
export default SlashMenuPlugin;
