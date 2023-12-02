import { DROPDOWN_GAP } from '../Surface';

/**
 * Returns whether the dropdown overflows in x
 * @param x - left
 * @param width - dropdown width
 */
export const overflowsInX = (x: number, width: number) => x + width + DROPDOWN_GAP > window.innerWidth;

/**
 * Returns whether the dropdown overflows in y
 * @param y - top
 * @param height - dropdown height
 */
export const overflowsInY = (y: number, height: number) => y + height + DROPDOWN_GAP > window.innerHeight;

/**
 * Returns absolute position for portal dropdowns
 * @param anchorHeight
 * @param anchorLeftEdge
 * @param anchorRightEdge
 * @param anchorTopEdge
 * @param overflowX
 * @param overflowY
 */
export const getPortalPosition = (
  anchorHeight: number,
  anchorLeftEdge: number,
  anchorRightEdge: number,
  anchorTopEdge: number,
  gapFromAnchor: number,
  overflowX: boolean,
  overflowY: boolean
) => ({
  top: overflowY ? undefined : anchorTopEdge + anchorHeight + gapFromAnchor,
  bottom: overflowY ? window.innerHeight - anchorTopEdge - gapFromAnchor : undefined,
  left: overflowX ? undefined : anchorLeftEdge,
  right: overflowX ? window.innerWidth - anchorRightEdge : undefined
});

/**
 * Returns absolute position for non-portal dropdowns
 * @param anchorWidth
 * @param dropdownWidth
 * @param overflowX
 */
export const getNonPortalPosition = (anchorWidth: number, dropdownWidth: number, overflowX: boolean) => {
  const right = overflowX ? dropdownWidth - anchorWidth : undefined;
  return { right };
};
