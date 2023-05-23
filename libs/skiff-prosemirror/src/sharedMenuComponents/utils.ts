import { Node as ProsemirrorNode } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { Ref, useEffect, useState } from 'react';

import { MentionSuggestions, MenuDirection } from '../mentionsMenu/utils';
import { HEADING, PARAGRAPH } from '../NodeNames';
import { MenuItem } from '../slashMenu/InterfacesAndEnums';

export const MENU_ITEM_HEIGHT = 32;
export const DEFAULT_EDITOR_MENU_HEIGHT = 300;

/**
 * Function scrolls the appropriate menuItem into view when selected with arrows
 * @param selectedId {string|undefined} id of the selected item
 * @param element{HTMLElement|null} the menu element in which the scrolling occurs
 */
export const handleScrollingAction = (selectedId: string | undefined, element: HTMLElement | null) => {
  if (selectedId && element) {
    const selectedItem = document.getElementById(selectedId);
    // checking selectedItem to avoid TSError
    const selectedItemPos = selectedItem
      ? selectedItem.getBoundingClientRect().top - element?.getBoundingClientRect().top
      : 0;

    // scroll down selected to item if out of view
    if (selectedItem && DEFAULT_EDITOR_MENU_HEIGHT - selectedItemPos - MENU_ITEM_HEIGHT < 0) {
      element.scrollTo(0, selectedItem?.offsetTop - DEFAULT_EDITOR_MENU_HEIGHT);
    }

    // scroll up if item is out of you on top
    if (selectedItem && DEFAULT_EDITOR_MENU_HEIGHT - selectedItemPos > DEFAULT_EDITOR_MENU_HEIGHT) {
      element.scrollTo(0, selectedItem?.offsetTop - MENU_ITEM_HEIGHT);
    }
  }
};

const LINE_HEIGHT_BY_TEXTBLOCK_TYPE = {
  [PARAGRAPH]: 35,
  [HEADING]: {
    1: 45,
    2: 45,
    3: 40
  }
};

/**
 * @function a custom hook to dynamically calculate the position of the menu, it can change depending on the available suggetions
 * @param view {EditorView}
 * @param wrapperRef {Ref<HTMLParagraphElement>} -  ref for the menu wrapper div
 * @param top {number} -  vertical distance from the top of the parent div
 * @param currentLine {Node|null} -  the line that the cursor is in, we need the height of that line to position the menu properly
 * @param items {Array<MentionRef>} - available items in menu, menu top position is depending on this
 */
export const useVerticalPositionEditorMenu = (
  view: EditorView,
  wrapperRef: Ref<HTMLParagraphElement>,
  top: number,
  currentParent: ProsemirrorNode,
  items: MentionSuggestions | Array<MenuItem>
): { verticalPosition: number; direction: MenuDirection | undefined } => {
  const [position, setPosition] = useState<number>(0);
  const [direction, setDirection] = useState<MenuDirection | undefined>(undefined);
  const box = view.dom.getBoundingClientRect();

  // We need the current line height to adjust Menu position depending on character size
  const lineHeight =
    currentParent.type.name === HEADING
      ? LINE_HEIGHT_BY_TEXTBLOCK_TYPE[HEADING][currentParent.attrs.level]
      : LINE_HEIGHT_BY_TEXTBLOCK_TYPE[currentParent.type.name];

  const overFlownDownwards = DEFAULT_EDITOR_MENU_HEIGHT + top + lineHeight + 32 > window.innerHeight;
  // runs only once, sets the direction permanently
  useEffect(() => {
    if (overFlownDownwards) {
      setDirection(MenuDirection.up);
    } else {
      setDirection(MenuDirection.down);
    }
  }, [overFlownDownwards, direction]);

  // This function calculated the updated position whenever new items are filtered in and out and menuHeight changes when the menu is ope
  useEffect(() => {
    // wrapperRef.current exists, for some reason typescript doesnt see it
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const menu = wrapperRef?.current;
    const overFlownUpwards = menu.clientHeight > top - box.top;
    const bottomPos = top - box.top + lineHeight;
    // In case the menu would overflow upwards, we position it on top of our document
    const topPos = overFlownUpwards ? 22 : top - box.top - menu.clientHeight - 5;

    const newPos = direction === MenuDirection.up ? topPos : bottomPos;
    setPosition(newPos);
  }, [direction, wrapperRef, items, top, box.top, lineHeight]);
  return { verticalPosition: position, direction };
};
