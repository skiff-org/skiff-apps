import { CellSelection, getSelectedCellsCoords, isInTable } from '@skiff-org/prosemirror-tables';
import crelt from 'crelt';
import { AllSelection, EditorState, NodeSelection, Selection, TextSelection } from 'prosemirror-state';
import { findParentNodeOfType } from 'prosemirror-utils';
import { EditorView } from 'prosemirror-view';

import { COMMENT } from '../EditorCommands';
import { CODE_BLOCK, IMAGE } from '../NodeNames';
import { getCustomState } from '../skiffEditorCustomStatePlugin';

export enum ToolbarTypes {
  static = 'static',
  text = 'text-selection',
  cell = 'cell-selection',
  image = 'image-selection',
  table = 'table',
  mobile = 'mobile',
  all = 'all',
  code = 'code',
  noToolbar = 'no-toolbar'
}

export const animationDirectionByState: {
  [key: string]: 'up' | 'down';
} = {
  static: 'down',
  table: 'down',
  'text-selection': 'up',
  'cell-selection': 'up',
  'image-selection': 'up',
  code: 'down'
};

export interface PositionUpdate {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  updateToolbarCssLayoutCb?: (dom: HTMLElement) => void;
}

// TODO_TB: add css const for animation duration
export const TOOLBAR_ANIMATIONS_DURATION = 200;

export const STATIC_POSITION = {
  bottom: 40
};

export const TOOLBAR_DOM_CLASS_NAME = 'floating-toolbar-scroll-container';

export const buildFloatingToolbarDOM = () => {
  const scrollContainer = crelt('div', { class: TOOLBAR_DOM_CLASS_NAME });
  const toolbarContainer = crelt('div', { class: 'floating-toolbar-container' });

  scrollContainer.appendChild(toolbarContainer);

  return scrollContainer;
};

export const getToolbarType = (state: EditorState): ToolbarTypes => {
  const { selection: sel } = state;
  const codeBlockParent = findParentNodeOfType(state.schema.nodes[CODE_BLOCK])(sel); // Is the selection inside a codeblock
  if (sel instanceof AllSelection) return ToolbarTypes.all;
  if (sel instanceof CellSelection) return ToolbarTypes.cell;
  if (codeBlockParent && !sel.empty && COMMENT.isEnabled(state)) return ToolbarTypes.code;
  if (codeBlockParent) return ToolbarTypes.noToolbar;
  if (sel instanceof TextSelection && sel.from !== sel.to) return ToolbarTypes.text;
  if (isInTable(state as any)) return ToolbarTypes.table;
  if (sel instanceof TextSelection && sel.from === sel.to) return ToolbarTypes.static;
  if (sel instanceof NodeSelection && sel.node.type.name === IMAGE) return ToolbarTypes.image;

  return ToolbarTypes.static;
};

const BLOCK_SELECTION_SIZE_OFFSET = 2;
const TOOLBAR_TOP_FLOAT_OFFSET = 12;
const TEXT_LEFT_FLOAT_OFFSET = 100;

const getTextSelectionPosition = (
  view: EditorView,
  offsetParent: HTMLElement,
  toolbarDOM: HTMLElement
): PositionUpdate | null => {
  const windowSelection = window.getSelection();
  if (!windowSelection) return null;

  const offsetParentBox = offsetParent.getBoundingClientRect();
  const { scrollTop } = offsetParent;

  const selectionRange = windowSelection.getRangeAt(0); // get the text range
  const selectionRects = selectionRange.getClientRects();
  const { top: selectionTop, left: selectionLeft } = view.coordsAtPos(view.state.selection.from);

  const { height: toolbarHeight, width: toolbarWidth } = (toolbarDOM.firstChild as HTMLElement).getBoundingClientRect();

  const top = selectionTop - (toolbarHeight + TOOLBAR_TOP_FLOAT_OFFSET) + scrollTop - offsetParentBox.top;
  const left = selectionLeft - TEXT_LEFT_FLOAT_OFFSET - offsetParentBox.left;
  const toolbarRight = left + offsetParentBox.left + toolbarWidth;

  const { selection: sel } = view.state;

  const selectionBreaksLine = selectionRects.length
    ? Array.from(selectionRects).reduce((sameLine, rect) => rect.top !== selectionRects.item(0)!.top || sameLine, false)
    : false;

  const moreThenOneNodeSelected = sel.content().content.childCount > 1;
  const blockSelected =
    sel.$from.parentOffset === 0 && sel.$from.parent.nodeSize - sel.content().size < BLOCK_SELECTION_SIZE_OFFSET;
  const toolbarExceedingEditor = toolbarRight > offsetParentBox.right;

  if (selectionBreaksLine || moreThenOneNodeSelected || toolbarExceedingEditor || blockSelected) {
    if (toolbarExceedingEditor && !selectionBreaksLine && !blockSelected && !moreThenOneNodeSelected) {
      return {
        left: offsetParentBox.right - toolbarWidth - offsetParentBox.left - TEXT_LEFT_FLOAT_OFFSET,
        top,
        updateToolbarCssLayoutCb: (dom: HTMLElement) => {
          dom.style.width = 'fit-content';
          dom.style.justifyContent = 'flexStart';
        }
      };
    }
    return {
      top,
      updateToolbarCssLayoutCb: (dom: HTMLElement) => {
        dom.style.justifyContent = 'center';
        dom.style.width = `calc(100% - ${offsetParentBox.left}px)`;
      }
    };
  } else {
    return {
      left,
      top,
      updateToolbarCssLayoutCb: (dom: HTMLElement) => {
        dom.style.width = 'fit-content';
        dom.style.justifyContent = 'flexStart';
      }
    };
  }
};

const getStaticPosition = (view: EditorView): PositionUpdate => ({
  bottom: getCustomState(view.state).isPublicDocument ? STATIC_POSITION.bottom + 40 : STATIC_POSITION.bottom,
  updateToolbarCssLayoutCb: (dom: HTMLElement) => {
    dom.style.width = '100%';
    dom.style.justifyContent = 'center';
  }
});

const getImageSelection = (view: EditorView, offsetParent: HTMLElement, scrollDOM: HTMLElement) => {
  const offsetParentBox = offsetParent.getBoundingClientRect();
  const { scrollTop } = offsetParent;
  const toolbarBox = (scrollDOM.firstChild! as HTMLElement).getBoundingClientRect();
  const top =
    view.coordsAtPos(view.state.selection.from).top -
    offsetParentBox.top -
    toolbarBox.height -
    TOOLBAR_TOP_FLOAT_OFFSET +
    scrollTop;

  return {
    top,
    updateToolbarCssLayoutCb: (dom: HTMLElement) => {
      dom.style.justifyContent = 'center';
      dom.style.width = `calc(100% - ${offsetParentBox.left}px)`;
    }
  };
};

const getCellSelectionPos = (view: EditorView, offsetParent: HTMLElement, scrollDOM: HTMLElement) => {
  if (!(view.state.selection instanceof CellSelection)) return null;
  const selectedCellsRect = getSelectedCellsCoords(view);
  const { width: toolbarWidth, height: toolbarHeight } = (scrollDOM.firstChild! as HTMLElement).getBoundingClientRect();
  const { left: editorLeft, right: editorRight, top: editorTop } = offsetParent.getBoundingClientRect();
  const { scrollTop } = offsetParent;

  const toolbarExceedingToRight =
    selectedCellsRect.right - selectedCellsRect.width / 2 + toolbarWidth / 2 > editorRight;
  const toolbarExceedingToLeft = selectedCellsRect.left + selectedCellsRect.width / 2 - toolbarWidth / 2 < editorLeft;

  let top = selectedCellsRect.top - toolbarHeight + scrollTop - editorTop - TOOLBAR_TOP_FLOAT_OFFSET;
  let left;

  if (toolbarExceedingToRight) {
    left = selectedCellsRect.left + (editorRight - selectedCellsRect.left) / 2 - toolbarWidth / 2 - editorLeft;
  } else if (toolbarExceedingToLeft) {
    left = (selectedCellsRect.right - editorLeft) / 2 - toolbarWidth / 2;
  } else if (view.state.selection.isColSelection()) {
    left = selectedCellsRect.left + selectedCellsRect.width / 2 - toolbarWidth / 2 - editorLeft;
    top = top - 10;
  } else {
    left = selectedCellsRect.left + selectedCellsRect.width / 2 - toolbarWidth / 2 - editorLeft;
  }

  return {
    top,
    left,
    updateToolbarCssLayoutCb: (dom: HTMLElement) => {
      dom.style.width = 'fit-content';
      dom.style.justifyContent = 'flexStart';
    }
  };
};

const getMobilePosition = (scrollDOM: HTMLElement): PositionUpdate => {
  const { height: toolbarHeight } = (scrollDOM.firstChild! as HTMLElement).getBoundingClientRect();

  return {
    bottom: toolbarHeight,
    updateToolbarCssLayoutCb: (dom: HTMLElement) => {
      dom.style.width = '100%';
      dom.style.justifyContent = 'center';
    }
  };
};

export const positionToolbar = (
  view: EditorView,
  toolbarType: ToolbarTypes,
  scrollDOM: HTMLElement,
  editorDOM: Element
): PositionUpdate | null => {
  if (isMobile()) return getMobilePosition(scrollDOM);
  if (toolbarType === ToolbarTypes.text) return getTextSelectionPosition(view, editorDOM as HTMLElement, scrollDOM);
  if (toolbarType === ToolbarTypes.static || toolbarType === ToolbarTypes.table || toolbarType === ToolbarTypes.all)
    return getStaticPosition(view);
  if (toolbarType === ToolbarTypes.image) return getImageSelection(view, editorDOM as HTMLElement, scrollDOM);
  if (toolbarType === ToolbarTypes.cell) return getCellSelectionPos(view, editorDOM as HTMLElement, scrollDOM);
  if (toolbarType === ToolbarTypes.code) return getCodeSelectionPosition(view, editorDOM as HTMLElement, scrollDOM);
  return null;
};

export const setDomCoords = (dom: HTMLElement, coords: any, editorLeftOffset: number) => {
  dom.style.cssText = `
    ${dom.style.cssText}
    top: ${coords.top !== undefined ? `${coords.top}px` : 'unset'};
    bottom: ${coords.bottom !== undefined ? `${coords.bottom}px` : 'unset'};
    left: ${coords.left !== undefined ? coords.left : editorLeftOffset}px;
    right: ${coords.right !== undefined ? `${coords.right}px` : 'unset'};
  `;
};

export const shouldUpdatePosition = (
  state: EditorState,
  prevSelection: Selection,
  toolbarType: ToolbarTypes,
  prevToolbarType: ToolbarTypes
) => {
  if (toolbarType === ToolbarTypes.static && prevToolbarType === ToolbarTypes.static) return false;
  if (toolbarType === ToolbarTypes.table && prevToolbarType === ToolbarTypes.table) return false;

  const { selection: currentSelection } = state;

  if (!prevSelection || !currentSelection) return true;

  if (
    currentSelection instanceof prevSelection.constructor &&
    currentSelection.from === prevSelection.from &&
    currentSelection.to === prevSelection.to
  ) {
    return false;
  }

  return true;
};

export const isMobile = () => window.innerWidth < 480;

export function getCodeSelectionPosition(
  view: EditorView,
  offsetParent: HTMLElement,
  scrollDOM: HTMLElement
): PositionUpdate | null {
  const windowSelection = window.getSelection();
  if (!windowSelection) return null;
  if (!windowSelection.rangeCount) return null;
  const range = windowSelection.getRangeAt(0);

  const selectionRects = range.getClientRects()[0];
  if (!selectionRects) return null;

  const { width: toolbarWidth, height: toolbarHeight } = (scrollDOM.firstChild! as HTMLElement).getBoundingClientRect();
  const { left: editorLeft, top: editorTop } = offsetParent.getBoundingClientRect();
  const { scrollTop } = offsetParent;

  return {
    left: selectionRects.left - editorLeft - toolbarWidth,
    top: selectionRects.top - toolbarHeight + scrollTop - editorTop,
    updateToolbarCssLayoutCb: (dom: HTMLElement) => {
      dom.style.width = 'fit-content';
      dom.style.justifyContent = 'flexStart';
    }
  };
}
