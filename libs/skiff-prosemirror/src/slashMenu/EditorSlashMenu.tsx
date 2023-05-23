import '../ui/skiff-editor-menus.css';

import { EditorView } from 'prosemirror-view';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { BodyPopup, positionBodyPopupAccordingToSelection } from '../comments/components/BodyPopup';
import MenuInput from '../sharedMenuComponents/MenuInput';
import { handleScrollingAction } from '../sharedMenuComponents/utils';

import { MenuItem, SLASH_MENU_ID, SlashMenuState, SubMenuTypes } from './InterfacesAndEnums';
import SlashMenuItem from './SlashMenuItem';
import { getSelectedItem, setMenuItemClasses } from './utils';

const SLASH_MENU_SIZE = { width: 200, height: 340 };
const SLASH_MENU_OFFSETS = { top: 35, left: 0 };

/**
 * displays the slash menu in the proper position and state
 *
 * @param {CustomEditorView} view prosemirror editor view
 * @param {SlashMenuState} slashMenuState
 *                  open is TRUE if slashMenu is open, openedMenuType is the type of sub menu that is open,
 *                  position is the cursor position, selected option is the index of the currently selected menu item in the array,
 *                  menuItems and headerItems contain the options in the menu
 *
 */
const EditorSlashMenu = ({ view, slashMenuState }: { view: EditorView; slashMenuState: SlashMenuState }) => {
  const wrapperRef = useRef<HTMLParagraphElement>(null);
  const {
    open,
    openedMenuType,
    headerItems,
    mainMenuItems,
    textColorItems,
    highLightColorItems,
    fontTypeItems,
    noMatchItems,
    areThereOptions,
    filter
  } = slashMenuState;

  const [forceUpdate, setForceUpdate] = useState(0);
  const [activeItems, setActiveItems] = useState(mainMenuItems);

  useEffect(() => {
    const cases = {
      [SubMenuTypes.MAIN_MENU]: () => setActiveItems(mainMenuItems),
      [SubMenuTypes.HEADING_MENU]: () => setActiveItems(headerItems),
      [SubMenuTypes.TEXT_COLOR_MENU]: () => setActiveItems(textColorItems),
      [SubMenuTypes.HIGHLIGHT_MENU]: () => setActiveItems(highLightColorItems),
      [SubMenuTypes.FONT_TYPE_MENU]: () => setActiveItems(fontTypeItems)
    };
    cases[openedMenuType]();
    if (!areThereOptions) {
      setActiveItems(noMatchItems);
    }
  }, [slashMenuState]);

  // When the menu is opened above the line and user opens up the headers menu with more height, the y coordinate is still calculated for the shorter main menu
  // resulting the menu overflowing the window, similarly if the user comes back from the headers menu, the shorter main menu will be higher then it should be
  // with updating a component state when the openedMenuType value is changed, we force a re-render to solve this issue
  // When the items change, the position is changed as well, so we force re render
  useEffect(() => {
    setForceUpdate(forceUpdate + 1);
  }, [openedMenuType, mainMenuItems, headerItems]);

  useEffect(() => {
    const element = document.getElementById(SLASH_MENU_ID);
    const selectedId = getSelectedItem(slashMenuState)?.id;
    // we scroll the selected item to the top of the menu
    if (slashMenuState.open) {
      handleScrollingAction(selectedId, element);
    }
  }, [slashMenuState.selectedOption, slashMenuState.open]);

  // this effect changes the classes on the slash menu according to which one is selected
  // TODO Aaron 2020/05/19 instead of ID it would be better to use refs for this purpose, which would require creating and passing refs using forwardRef on slashMenuItems
  useEffect(() => {
    const selectedItem = getSelectedItem(slashMenuState);
    const cases = {
      [SubMenuTypes.MAIN_MENU]: () => setMenuItemClasses(mainMenuItems, selectedItem),
      [SubMenuTypes.HEADING_MENU]: () => setMenuItemClasses(headerItems, selectedItem),
      [SubMenuTypes.TEXT_COLOR_MENU]: () => setMenuItemClasses(textColorItems, selectedItem),
      [SubMenuTypes.HIGHLIGHT_MENU]: () => setMenuItemClasses(highLightColorItems, selectedItem),
      [SubMenuTypes.FONT_TYPE_MENU]: () => setMenuItemClasses(fontTypeItems, selectedItem)
    };
    if (open && selectedItem) {
      cases[openedMenuType]();
      if (!areThereOptions) {
        setMenuItemClasses(noMatchItems, selectedItem);
      }
    }
  }, [slashMenuState]);

  const slashMenuPopupCoords = useMemo(
    () => positionBodyPopupAccordingToSelection(view, SLASH_MENU_SIZE, 30, SLASH_MENU_OFFSETS),
    []
  );
  return (
    <BodyPopup {...slashMenuPopupCoords}>
      <div>
        {open && (
          <div ref={wrapperRef} className='skiff-editor-menu-wrapper'>
            <MenuInput value={filter} />
            <div className='skiff-editor-menu' id={SLASH_MENU_ID}>
              {activeItems === noMatchItems &&
                noMatchItems.map((item) => <SlashMenuItem item={item} key={item.id} view={view} />)}
              {openedMenuType === SubMenuTypes.MAIN_MENU &&
                mainMenuItems.length > 0 &&
                mainMenuItems.map((item: MenuItem) => <SlashMenuItem item={item} key={item.id} view={view} />)}
              {openedMenuType === SubMenuTypes.HEADING_MENU &&
                headerItems.length > 0 &&
                headerItems.map((item: MenuItem) => <SlashMenuItem item={item} key={item.id} view={view} />)}
              {openedMenuType === SubMenuTypes.TEXT_COLOR_MENU &&
                textColorItems.length > 0 &&
                textColorItems.map((item: MenuItem) => <SlashMenuItem item={item} key={item.id} view={view} />)}
              {openedMenuType === SubMenuTypes.HIGHLIGHT_MENU &&
                highLightColorItems.length > 0 &&
                highLightColorItems.map((item: MenuItem) => <SlashMenuItem item={item} key={item.id} view={view} />)}
              {openedMenuType === SubMenuTypes.FONT_TYPE_MENU &&
                fontTypeItems.length > 0 &&
                fontTypeItems.map((item: MenuItem) => <SlashMenuItem item={item} key={item.id} view={view} />)}
            </div>
          </div>
        )}
      </div>
    </BodyPopup>
  );
};

export default EditorSlashMenu;
