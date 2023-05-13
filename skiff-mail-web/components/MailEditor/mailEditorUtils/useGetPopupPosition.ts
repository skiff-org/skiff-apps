import { Editor } from '@tiptap/core';
import { RefObject, useEffect, useState } from 'react';

import { getElementOnSelection } from './selection';

interface Position {
  top: number;
  left: number;
  width: number;
}

const DROPDOWN_GAP = 6;
const OPEN_UPWARDS_OFFSET = 30;

export function useGetPopupPosition(
  editor: Editor,
  popupRef: RefObject<HTMLDivElement>,
  editorContainerRef: React.RefObject<HTMLDivElement>,
  id: string
) {
  const toolbarGroup = document.getElementById(id);
  const toolbarRect = toolbarGroup?.getBoundingClientRect();
  const popupRect = popupRef?.current?.getBoundingClientRect();
  const [position, setPosition] = useState<Position>({ top: 0, left: 0, width: 0 });
  const elementOnSelection = getElementOnSelection(editor);
  const openUpwards = (popupRect?.height || 0) + (toolbarRect?.top || 0) >= window.innerHeight - OPEN_UPWARDS_OFFSET;
  useEffect(() => {
    setPosition({
      left: toolbarRect?.left || 0,
      width: toolbarRect?.width || 0,
      top:
        (toolbarRect?.top || 0) +
        (openUpwards ? -(popupRect?.height || 0) - DROPDOWN_GAP : (toolbarRect?.height || 0) + DROPDOWN_GAP)
    });
  }, [
    popupRect?.height,
    popupRect?.width,
    elementOnSelection,
    editorContainerRef,
    toolbarRect?.left,
    toolbarRect?.width,
    toolbarRect?.bottom,
    toolbarRect?.top
  ]);

  return position;
}
