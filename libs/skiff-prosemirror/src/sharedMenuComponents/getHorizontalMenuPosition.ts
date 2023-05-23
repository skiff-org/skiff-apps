/* eslint-disable @typescript-eslint/ban-ts-comment */
import { EditorView } from 'prosemirror-view';

/**
 * Return the calculated x coordinates to the editor menus
 * @param view {EditorView}
 * @param position {number} cursor position in prosemirror
 */
// comes from --skiff-drag-handle as width from skiff-drag-handle.css
const DRAG_HANDLE_WIDTH = 18;
// comes from --drag-handle-left-margin: 25px in skiff-vars.css
const DRAG_HANDLE_MARGIN_OFFSET = 25;
const coordsAtPosLeft = (view: EditorView, pos: number) => {
  // this check ensures we dont get an error in console but causes ts ignores below
  if (pos <= 0 || pos > view.state.doc.content.size) {
    // We would get RangeError: Position outside of fragment. if we wouldn't check
    // Similar error occurred with the function in nodeAt.ts
    // return a default horizontal position, we could return undefined in which case the menu would be right next to the sidebar,
    // this way its sticks with the beginning of the document
    return view.coordsAtPos(1).left;
  }

  return view.coordsAtPos(pos).left;
};

export const getSidepanelOffset = () => {
  const sidepanel = document.getElementById('sidepanel');
  const editorSidepanelWidth = sidepanel ? sidepanel.offsetWidth : 0;
  return editorSidepanelWidth;
};

const getHorizontalMenuPosition = (view: EditorView, position: number, anchor?: Element) => {
  // TODO EE-AAron 2021/05/26 getElementById().offsetWidth might not be the best method to figure out the amount we need to offset the slash menu if the sidePanel is open
  // TODO a better idea is to find out the x coordinate of the view.doc element compared to the window, but view.doc.getBoundingClientRect() gives wrong value for some reason
  // if the editorSidePanel in react-client is open then we need to offset the position with its width
  const editorSidepanelWidth = document.getElementById('sidepanel')
    ? document.getElementById('sidepanel')?.offsetWidth
    : 0;

  const editorLeftOffset = view.dom.getBoundingClientRect().x || editorSidepanelWidth;

  // TODO Aaron-EE 2021/12/09 figure out to remove the TSignores we want the function to fail whn coordsAtPosLeft() gives undefined but we dont want and error message
  const left = anchor
    ? anchor.getBoundingClientRect().left
    : // When the cursor is not at the beginning of the paragraph an 18 px wide skiff-drag-handle will be invisibly rendered, pushing the menu to the right, in that case we subtract 18 px
    view.state.selection.$head.parentOffset === 0
    ? coordsAtPosLeft(view, position)
    : // @ts-ignore
      coordsAtPosLeft(view, position) - DRAG_HANDLE_WIDTH;

  return editorLeftOffset && left
    ? left - editorLeftOffset + DRAG_HANDLE_MARGIN_OFFSET
    : // @ts-ignore
      left + DRAG_HANDLE_MARGIN_OFFSET;
};
export default getHorizontalMenuPosition;
