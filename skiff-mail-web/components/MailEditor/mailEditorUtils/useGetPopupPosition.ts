import { Editor } from '@tiptap/core';
import { RefObject, useEffect, useState } from 'react';
import { getElementOnSelection } from './selection';

interface Position {
  top: number;
  left: number;
}

const LEFT_MARGIN = 5;

export function useGetPopupPosition(
  editor: Editor,
  editorBoundingRect: DOMRect | undefined,
  containerRef: RefObject<HTMLDivElement>,
  editorContainerRef: React.RefObject<HTMLDivElement>
) {
  const coordsAtSelection = editor.view.coordsAtPos(editor.view.state.selection.to);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const elementOnSelection = getElementOnSelection(editor);

  useEffect(() => {
    if (elementOnSelection.getBoundingClientRect) {
      const containerBoundingRect = containerRef.current?.getBoundingClientRect();
      const containerHeight = containerBoundingRect?.height || 0;
      const containerWidth = containerBoundingRect?.width || 0;

      const elementBoundingRect = (elementOnSelection as Element).getBoundingClientRect();

      // If the node is an anchor set the left position to its right
      // If not set it to the left of the selection
      let left =
        (elementOnSelection.nodeName === 'A' ? elementBoundingRect.right : coordsAtSelection.left) -
        (editorBoundingRect?.left || 0) +
        LEFT_MARGIN;
      let top =
        coordsAtSelection.bottom -
        (editorBoundingRect?.top || 0) -
        containerHeight / 2 -
        elementBoundingRect.height / 2 +
        (editorContainerRef.current?.scrollTop || 0);

      // Handle x overflow
      if (editorBoundingRect && left + containerWidth > editorBoundingRect?.width) {
        left = editorBoundingRect.width - containerWidth; // Move to right
        top = coordsAtSelection.bottom - (editorBoundingRect?.top || 0); // Move the link input down
      }

      //Handle y overflow
      if (
        editorBoundingRect &&
        top + containerHeight - (editorContainerRef.current?.scrollTop || 0) > editorBoundingRect?.height
      ) {
        top -= containerHeight * 2 - elementBoundingRect.height;
      }
      setPosition({ left, top });
    }
  }, [editorBoundingRect, containerRef, elementOnSelection]);

  return position;
}
