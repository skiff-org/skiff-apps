import { Editor } from '@tiptap/core';
import { RefObject, useEffect, useState } from 'react';

import { getElementOnSelection } from './selection';

interface Position {
  top: number;
  left: number;
}

const LEFT_MARGIN = 5;

export function useGetSelectionPosition(
  editor: Editor,
  popupRef: RefObject<HTMLDivElement>,
  editorContainerRef: React.RefObject<HTMLDivElement>
) {
  const coordsAtSelection = editor.view.coordsAtPos(editor.view.state.selection.to);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const elementOnSelection = getElementOnSelection(editor);

  useEffect(() => {
    if (elementOnSelection) {
      const popupBoundRect = popupRef.current?.getBoundingClientRect();
      const popupHeight = popupBoundRect?.height || 0;
      const popupWidth = popupBoundRect?.width || 0;
      const editorBoundingRect = editorContainerRef.current?.getBoundingClientRect();
      const editorHeight = editorBoundingRect?.height || 0;
      const elementBoundingRect = elementOnSelection.getBoundingClientRect();
      const elementLeft = elementBoundingRect.left;
      const elementButtom = elementBoundingRect.bottom;
      const elementTop = elementBoundingRect.top;
      // we are using two different variables to define the horizontal alignment
      // because `coordsAtPos` is pointing tothe cursor when not selected,
      // thus it will cause alignment to the cursor when clicking on a link.
      let horizontalAlignLocation = elementLeft - (editorBoundingRect?.left || 0) + LEFT_MARGIN;

      let verticalAlignLocation =
        elementButtom - // the correct element to refrence from
        (editorBoundingRect?.top || 0) - // the height betweem the top of the editor and the top of the screen.
        popupHeight - // top the popup
        elementBoundingRect.height + // top the popup
        (editorContainerRef.current?.scrollTop || 0); // calculating the scroll

      // if the width of the selected text and the width of the popup is bigger then the width of the editor,
      // the popup should appear under the selected text and to the right.
      if (editorBoundingRect && horizontalAlignLocation + popupWidth > editorBoundingRect?.width) {
        horizontalAlignLocation =
          (elementBoundingRect.width <= popupWidth ? editorBoundingRect.width : elementBoundingRect.width) - popupWidth;
        verticalAlignLocation =
          elementButtom - (editorBoundingRect?.top || 0) + (editorContainerRef.current?.scrollTop || 0);
      }
      // if some of the popup is out of the view of the editor,
      // the popup should appear under the selected text.
      if (verticalAlignLocation - (editorContainerRef.current?.scrollTop || 0) < 0) {
        verticalAlignLocation =
          elementButtom - (editorBoundingRect?.top || 0) + (editorContainerRef.current?.scrollTop || 0);
        horizontalAlignLocation -= LEFT_MARGIN * 2;
      }

      // if some of the popup is under of the view of the editor,
      // the popup should appear under the selected text.
      if (
        verticalAlignLocation +
          // resetting the vertical height to be aligned to bottom
          elementBoundingRect.height +
          popupHeight -
          // removing the scroll height
          (editorContainerRef.current?.scrollTop || 0) >
        editorHeight
      ) {
        verticalAlignLocation =
          elementTop - (editorBoundingRect?.top || 0) + (editorContainerRef.current?.scrollTop || 0) - popupHeight;
        horizontalAlignLocation -= LEFT_MARGIN * 2;
      }

      setPosition({ left: horizontalAlignLocation, top: verticalAlignLocation });
    }
  }, [
    popupRef,
    elementOnSelection,
    editorContainerRef,
    coordsAtSelection.left,
    coordsAtSelection.bottom,
    coordsAtSelection.top
  ]);

  return position;
}
