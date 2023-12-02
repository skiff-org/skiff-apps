import * as React from 'react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { MOUSE_SAFE_AREA_CLASSNAME } from '../../constants';
import { useMousePosition } from '../../hooks';

import { DROPDOWN_DEFAULT_Z_INDEX, GAP_BETWEEN_MOUSE_AND_SAFE_AREA } from './Dropdown.constants';
import { MouseSafeAreaProps } from './Dropdown.types';

const Wrapper = styled.div<{
  $clipPath?: string;
  $height?: number;
  $left?: number;
  $right?: number;
  $top?: number;
  $width?: number;
}>`
  position: absolute;
  z-index: ${DROPDOWN_DEFAULT_Z_INDEX};
  // background: orange; // for debugging

  ${({ $clipPath }) => $clipPath !== undefined && `clip-path: ${$clipPath};`}
  ${({ $height }) => $height !== undefined && `height: ${$height}px;`}
  ${({ $left }) => $left !== undefined && `left: ${$left}px;`}
  ${({ $right }) => $right !== undefined && `right: ${$right}px;`}
  ${({ $top }) => $top !== undefined && `top: ${$top}px;`}
  ${({ $width }) => $width !== undefined && `width: ${$width}px;`};
`;

// From https://gist.github.com/eldh/51e3825b7aa55694f2a5ffa5f7de8a6a
// open sourced by Linear.app

/**
 * Component to cover the area between the mouse cursor and the submenu, to
 * allow moving cursor to lower parts of sub-menu without the submenu disappearing.
 */
function MouseSafeArea({ openRight, parentRef }: MouseSafeAreaProps) {
  // Mouse safe area positions and dimensions
  const [left, setLeft] = useState<number | undefined>(undefined);
  const [right, setRight] = useState<number | undefined>(undefined);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const [clipPath, setClipPath] = useState<string | undefined>(undefined);

  // Mouse positions
  const [mouseX, mouseY] = useMousePosition();

  // Submenu positions and dimensions
  const {
    top: submenuTop = 0,
    left: submenuLeft = 0,
    right: submenuRight = 0,
    height: submenuHeight = 0
  } = parentRef?.current?.getBoundingClientRect() || {};

  useEffect(() => {
    setTimeout(() => {
      // The safe area should be positioned to the left of the submenu if it's opened to the right of the parent cell
      const getLeft = () => (openRight ? undefined : submenuRight);
      // The safe area should be positioned to the right of the submenu if it's opened to the left of the parent cell
      const getRight = () => (openRight ? window.innerWidth - submenuLeft : undefined);
      // The safe area should span the whole area between the cursor and the submenu
      const getWidth = () =>
        openRight
          ? Math.max(submenuLeft - mouseX - GAP_BETWEEN_MOUSE_AND_SAFE_AREA, 10)
          : Math.max(mouseX - submenuRight - GAP_BETWEEN_MOUSE_AND_SAFE_AREA, 10);
      // Renders the safe area triangle
      const getClipPath = () =>
        openRight
          ? `polygon(100% 0%, 0% ${(100 * (mouseY - submenuTop)) / submenuHeight}%, 100% 100%)`
          : `polygon(0% 0%, 0% 100%, 100% ${(100 * (mouseY - submenuTop)) / submenuHeight}%)`;

      setLeft(getLeft());
      setRight(getRight());
      setWidth(getWidth());
      setClipPath(getClipPath());
    }, 100);
  }, [mouseX, mouseY, openRight, submenuHeight, submenuLeft, submenuRight, submenuTop]);

  return (
    <Wrapper
      className={MOUSE_SAFE_AREA_CLASSNAME}
      $clipPath={clipPath}
      $height={submenuHeight}
      $width={width}
      $left={left}
      $right={right}
      $top={submenuTop}
    />
  );
}

export default MouseSafeArea;
