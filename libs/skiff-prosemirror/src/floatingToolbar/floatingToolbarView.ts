import crelt from 'crelt';
import { renderGrouped } from 'prosemirror-menu';
import { EditorState, Selection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { EditorHighlightColorIds, HIGHLIGHT_COLORS, TEXT_COLORS } from 'skiff-front-utils';

import { commentPluginKey } from '../comments/comment.types';
import { H1, H2, H3, OL, TEXT_COLOR, TO_DO, TOGGLE_LIST_INSERT, UL } from '../EditorCommands';

import { isCellColorActive } from '@skiff-org/prosemirror-tables';
import { toolbarItems } from './toolbarItems';
import AnimatedDropdown from './toolbarItems/customMenu/AnimatedDropdown';
import SkiffMenuItem from './toolbarItems/customMenu/SkiffMenuItem';
import { ToolbarItemsIds } from './toolbarItems/itemsMap';
import { getSpecialBackgrounds } from './toolbarItems/textItems';
import {
  animationDirectionByState,
  buildFloatingToolbarDOM,
  getToolbarType,
  isMobile,
  positionToolbar,
  PositionUpdate,
  setDomCoords,
  shouldUpdatePosition,
  TOOLBAR_ANIMATIONS_DURATION,
  TOOLBAR_DOM_CLASS_NAME,
  ToolbarTypes
} from './utils';

// initialize mobile state
window.mobileToolbarState = {};

class FloatingToolbarView {
  scrollDOM: HTMLElement;

  toolbarDOM: HTMLElement;

  toolbarRelativeContainer: Element;

  timer: NodeJS.Timeout | null;

  debouncedUpdate: (view: EditorView) => void;

  oldSelection: Selection;

  prevToolbarType: ToolbarTypes;

  items: { itemsDOM: DocumentFragment; updateItems: (p: EditorState<any>) => boolean };

  constructor(private view: EditorView) {
    this.scrollDOM = buildFloatingToolbarDOM();
    this.toolbarDOM = this.scrollDOM.firstChild! as HTMLElement;
    this.timer = null;
    this.oldSelection = view.state.selection;
    this.prevToolbarType = ToolbarTypes.static;

    this.updateHiddenState();

    // create debounced function for menu updates
    this.debouncedUpdate = this.debounceUpdate(this.updateToolbar);

    // the dom element that contains the toolbar - should be css relative
    this.toolbarRelativeContainer = document.getElementsByClassName('skiff-editor-frame-body')[0];

    // remove all existing instances if there are
    const oldToolbars = this.toolbarRelativeContainer.getElementsByClassName(TOOLBAR_DOM_CLASS_NAME);
    Array.from(oldToolbars).forEach((toolbar) => toolbar.remove());
    this.toolbarRelativeContainer.appendChild(this.scrollDOM);

    const toolbarType = getToolbarType(view.state);
    this.appendClassToToolbar(toolbarType);

    const { dom: itemsDOM, update: updateItems } = renderGrouped(this.view, toolbarItems);
    this.items = { itemsDOM, updateItems };
    this.toolbarDOM.appendChild(itemsDOM);
    this.updateToolbar(this.view, true);

    window.handleOutsideToolbarClick = (itemID: ToolbarItemsIds) => {
      toolbarItems.flat().forEach((itemConfig: SkiffMenuItem | AnimatedDropdown) => {
        if (itemConfig instanceof AnimatedDropdown) {
          itemConfig.content.forEach((subItemConfig: SkiffMenuItem) => {
            if (subItemConfig.id === itemID) {
              subItemConfig.spec.run(this.view.state, this.view.dispatch, this.view);
            }
          });
        } else if (itemConfig.id === itemID) {
          itemConfig.spec.run(this.view.state, this.view.dispatch, this.view);
        }
      });
    };
  }

  appendClassToToolbar(toolbarType: ToolbarTypes) {
    // clear previous classes
    Object.values(ToolbarTypes).map((className) => this.scrollDOM.classList.remove(className));

    this.scrollDOM.classList.toggle('mobile', isMobile());
    this.scrollDOM.classList.add(toolbarType);
  }

  updateToolbarPosition(view: EditorView, toolbarType: ToolbarTypes) {
    const newPosition = positionToolbar(view, toolbarType, this.scrollDOM, this.toolbarRelativeContainer);
    if (newPosition) {
      this.applyPositionWithAnimation(newPosition, animationDirectionByState[toolbarType]);
    }
  }

  getLabel(state: EditorState) {
    if (H1.isActive(state)) return 'Heading 1';
    if (H2.isActive(state)) return 'Heading 2';
    if (H3.isActive(state)) return 'Heading 3';
    if (OL.isActive(state)) return 'Numbered list';
    if (UL.isActive(state)) return 'Bulleted list';
    if (TO_DO.isActive(state)) return 'Todo list';
    if (TOGGLE_LIST_INSERT.isActive(state)) return 'Toggle list';
    return 'Body';
  }

  getColor(state: EditorState) {
    const activeColors = Object.keys(TEXT_COLORS).filter((color: string) =>
      TEXT_COLOR.isActive(state, TEXT_COLORS[color])
    );
    if (activeColors.length === 1) return TEXT_COLORS[activeColors[0]];
    return 'var(--text-primary)';
  }


  getBgCellColor(state: EditorState): string {
    const activeColors = Object.keys(HIGHLIGHT_COLORS).filter((color: string) =>
      isCellColorActive(state, HIGHLIGHT_COLORS[color] as string)
    );

    if (activeColors.length === 1) return HIGHLIGHT_COLORS[activeColors[0]] as string;
    return HIGHLIGHT_COLORS[EditorHighlightColorIds.TRANSPARENT];
  }

  updateToolbarItems(state: EditorState) {
    this.items.updateItems(state);
    const toolbarLabel = document.getElementsByClassName('text-item-dropdown')[0];
    const toolbarColor = document.getElementsByClassName('text-color-dropdown')[0];
    const toolbarCellBgColor = document.getElementsByClassName('cell-background-color-dropdown')[0];

    const newContent = document.createTextNode(this.getLabel(state));
    const icon = crelt('span', { class: `text-color-item-icon-toolbar` });
    icon.style.background = getSpecialBackgrounds(this.getColor(state) as string);

    const colorTooltip = crelt('span', { class: 'menu-tooltip' }, 'Color');
    const newColor = crelt('div', { class: `text-color-item-toolbar` }, icon, colorTooltip);

    const bgColorIcon = crelt('span', { class: `text-color-item-icon-toolbar` });
    bgColorIcon.style.background = getSpecialBackgrounds(this.getBgCellColor(state));
    const bgColorTooltip = crelt('span', { class: 'menu-tooltip' }, 'Cell background');
    const newBgCellColor = crelt('div', { class: `text-color-item-toolbar` }, bgColorIcon, bgColorTooltip);

    if (toolbarLabel?.firstChild) {
      toolbarLabel.replaceChild(newContent, toolbarLabel.firstChild);
    }
    if (toolbarColor?.firstChild) {
      toolbarColor.replaceChild(newColor, toolbarColor.firstChild);
    }
    if (toolbarCellBgColor?.firstChild) {
      toolbarCellBgColor.replaceChild(newBgCellColor, toolbarCellBgColor.firstChild);
    }
  }

  updateToolbar(view: EditorView, force?: boolean) {
    // // on load, editable can be false, so toggle here
    this.updateHiddenState();

    const toolbarType = getToolbarType(view.state);

    this.appendClassToToolbar(toolbarType);
    this.updateToolbarItems(view.state);

    if (shouldUpdatePosition(view.state, this.oldSelection, toolbarType, this.prevToolbarType) || force) {
      this.updateToolbarPosition(view, toolbarType);
      this.oldSelection = view.state.selection;
    }

    this.prevToolbarType = toolbarType;
  }

  updateHiddenState() {
    const { editable } = this.view;
    const commentsState = commentPluginKey.getState(this.view.state);
    const commentsOpen = commentsState?.open;
    const commentActive = commentsState?.activeThread; // Hide toolbar when comment is active (example: after comment is added)
    const toolbarType = getToolbarType(this.view.state);

    this.toolbarDOM.classList.toggle(
      'hidden',
      !editable || !!commentsOpen || toolbarType === ToolbarTypes.noToolbar || !!commentActive
    );
  }

  update(view: EditorView) {
    this.updateHiddenState();
    if (view.dragging) return;
    if (this.prevToolbarType === ToolbarTypes.noToolbar) {
      // Dont show animation on no-toolbar
      this.updateToolbar(view, true);
    } else {
      this.debouncedUpdate(view);
    }
  }

  applyPositionWithAnimation(newPosition: PositionUpdate, direction: 'up' | 'down') {
    if (newPosition && newPosition.updateToolbarCssLayoutCb) newPosition.updateToolbarCssLayoutCb(this.scrollDOM);
    const { left: editorLeftOffset } = this.toolbarRelativeContainer.getBoundingClientRect();

    if (!isMobile()) this.toolbarDOM.classList.toggle(`animation-fade-${direction}`, true);
    setDomCoords(this.scrollDOM, newPosition, editorLeftOffset / 2);
    if (!isMobile())
      setTimeout(
        () => this.toolbarDOM.classList.toggle(`animation-fade-${direction}`, false),
        TOOLBAR_ANIMATIONS_DURATION
      );
  }

  debounceUpdate(updater: any) {
    return (...args: any[]) => {
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        updater.apply(this, args);
      }, TOOLBAR_ANIMATIONS_DURATION);
    };
  }

  destroy() { }
}

export default FloatingToolbarView;
