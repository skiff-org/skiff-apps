import { EditorView } from 'prosemirror-view';
import React from 'react';
import { FC } from 'react';
import ReactDOM from 'react-dom';
import { assertExists } from 'skiff-utils';

export const BODY_POPUP_CLLASSNAME = 'bodypop';
export type CssPosition = number | 'unset';
export interface BodyPopupProps {
  top?: CssPosition;
  left?: CssPosition;
  bottom?: CssPosition;
  right?: CssPosition;
  flip?: boolean;
}
export const BodyPopup: FC<BodyPopupProps> = ({
  children,
  top = 'unset',
  left = 'unset',
  bottom = 'unset',
  right = 'unset',
  flip = false
}) =>
  ReactDOM.createPortal(
    <div
      className={BODY_POPUP_CLLASSNAME}
      style={{
        top,
        left,
        right,
        bottom,
        transform: flip ? 'translateY(-100%)' : 'unset',
        position: 'absolute',
        zIndex: 1400 //  must be higher than the dialog z index(1300)
      }}
    >
      {children}
    </div>,
    document.body
  );

/**
 * for the BodyPopup there's no need for offsets like sidebar or topbar because the pop 'lives' in a higher scope than the editor
 */
export const positionBodyPopupAccordingToSelection = (
  view: EditorView | null | undefined,
  popupDimentions: { height: number; width: number },
  thresholdFromWindow: number,
  offsets?: { top: number; left: number }
): BodyPopupProps => {
  if (!view) return { top: 0, left: 0 };
  const selectionCoords = view.coordsAtPos(view.state.selection.to);

  const { visualViewport } = window;
  assertExists(visualViewport, 'visualViewport is not supported');
  const popupBottomCoords = selectionCoords.top + (offsets?.top || 0) + popupDimentions.height;
  const popupRightCoords = selectionCoords.left + (offsets?.left || 0) + popupDimentions.width;

  let bottom, flip;

  let top: CssPosition = selectionCoords.top + (offsets?.top || 0);
  if (popupBottomCoords > visualViewport.height - thresholdFromWindow) {
    top = 'unset';
    bottom = visualViewport.height - selectionCoords.bottom + (offsets?.top || 0);
  }
  if (Number(top) < thresholdFromWindow) {
    top = thresholdFromWindow;
  }

  const left =
    popupRightCoords > visualViewport.width - thresholdFromWindow
      ? // selectionCoords.left and selectionCoords.right should be the same
        visualViewport.width - popupDimentions.width - thresholdFromWindow
      : selectionCoords.left + (offsets?.left || 0);

  return {
    top,
    left,
    flip,
    bottom
  };
};
