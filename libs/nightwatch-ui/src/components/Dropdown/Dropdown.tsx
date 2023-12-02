import React, { ForwardedRef, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { SIZE_HEIGHT } from '../../constants';
import { useKeyboardNavigation } from '../../hooks';
import { themeNames } from '../../theme';
import { Size, ThemeMode } from '../../types';
import BackgroundBlocker from '../../utils/BackgroundBlocker';
import { SUBMENU_OVERLAP } from '../DropdownSubmenu/DropdownSubmenu.constants';
import { InputComponent } from '../InputField';
import Portal from '../Portal';
import Surface, { DROPDOWN_CALLER_CLASSNAME, DROPDOWN_GAP } from '../Surface';
import { optionMenuPadding } from '../Surface/Surface';

import { DROPDOWN_CALLER_ID, DROPDOWN_DEFAULT_Z_INDEX, SUBMENU_CONTAINER_CLASS } from './Dropdown.constants';
import { ANCHORED_DROPDOWN_CSS, HIDE_MOUSE_CSS, NON_ANCHORED_DROPDOWN_CSS } from './Dropdown.styles';
import { DropdownAnchor, DropdownProps, SurfaceRect } from './Dropdown.types';
import { getNonPortalPosition, getPortalPosition, overflowsInX, overflowsInY } from './Dropdown.utils';
import MouseSafeArea from './MouseSafeArea';

const DropdownContainer = styled.div`
  position: relative;
  width: 0px;
`;

const StyledSurface = styled(Surface)<{
  $anchor: { top?: number; bottom?: number; left?: number; right?: number };
  $hideMouse: boolean;
  $isAnchored: boolean;
  $yShift: number;
  $defaultLeft?: number;
  $defaultTop?: number;
  $maxHeight?: number | string;
  $width?: number | string;
  $zIndex?: number;
}>`
  background: ${themeNames.dark['--bg-l3-solid']} !important;

  z-index: ${({ $zIndex }) => $zIndex ?? DROPDOWN_DEFAULT_Z_INDEX};
  width: ${({ $width }) => (!!$width ? `${typeof $width === 'string' ? $width : `${$width}px`}` : 'fit-content')};
  ${({ $hideMouse }) => $hideMouse && HIDE_MOUSE_CSS}
  ${({ $isAnchored }) => ($isAnchored ? ANCHORED_DROPDOWN_CSS : NON_ANCHORED_DROPDOWN_CSS)};

  ${({ $yShift }) => !!$yShift && `transform: translateY(${$yShift}px)`}

  ${({ $maxHeight }) =>
    $maxHeight &&
    `
      max-height: ${typeof $maxHeight === 'string' ? $maxHeight : `${$maxHeight}px`};
      overflow: hidden;
      :hover {
        overflow: auto;
      }
    `}
`;

const InputFieldContainer = styled.div`
  width: 100%;
  margin-bottom: 2px;
`;

function Dropdown(
  {
    children,
    buttonRef,
    className,
    clickOutsideWebListener,
    customAnchor,
    customBackgroundBlockerPos,
    dataTest,
    fullWidth = false,
    gapFromAnchor = 0,
    id,
    inputField: inputFieldProp,
    isSubmenu = false,
    keyboardNavControls,
    maxHeight,
    maxWidth,
    minWidth,
    noPadding = false,
    portal = false,
    showDropdown = true,
    width,
    zIndex,
    setShowDropdown
  }: DropdownProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  // -- States --
  // Dropdown anchor
  const [anchor, setAnchor] = useState<DropdownAnchor>({});
  // Current dropdown positions
  const [currSurfaceRect, setCurrSurfaceRect] = useState<SurfaceRect>({ width: 0, height: 0, x: 0, y: 0 });
  // If the dropdown is a submenu, this state indicates whether it opens to the right or to the left
  const [submenuOpenRight, setSubmenuOpenRight] = useState<boolean | undefined>(undefined);
  // For sub-menus
  // The amount by which the sub-menu will shift if it overflows in Y
  const [yShift, setYShift] = useState(0);

  // -- Custom hooks --
  // Handles keyboard navigation
  const hideMouse = useKeyboardNavigation(!showDropdown, keyboardNavControls);

  // -- Refs --
  const surfaceRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null);

  // Dropdown theme
  const forceTheme = ThemeMode.DARK;
  // Classes to ignore on outside click
  const classesToIgnore = [SUBMENU_CONTAINER_CLASS];
  // Current parent button positions
  const currButtonRect = buttonRef?.current?.getBoundingClientRect();
  // Extracted parent button positions and dimensions
  const {
    top: currButtonRectTop,
    bottom: currButtonRectBottom,
    left: currButtonRectLeft,
    width: currButtonRectWidth,
    height: currButtonRectHeight
  } = currButtonRect || {};
  // Extracted dropdown positions and dimensions
  const { x: currSurfaceX, y: currSurfaceY, width: currSurfaceWidth, height: currSurfaceHeight } = currSurfaceRect;
  // Default left position for an anchored dropdown
  const defaultDropdownLeft = currButtonRectLeft || 0;
  // Default top position for an anchored dropdown
  const defaultDropdownTop = (currButtonRectTop || 0) + (currButtonRectHeight || 0);

  const getCustomAnchor = useCallback(() => {
    let top: number | undefined = undefined;
    let bottom: number | undefined = undefined;
    let left: number | undefined = undefined;
    let right: number | undefined = undefined;

    const customAnchorX = customAnchor?.x || 0;
    const customAnchorY = customAnchor?.y || 0;

    // Whether dropdown overflows in x/y
    const overflowX = overflowsInX(customAnchorX, currSurfaceWidth);
    const overflowY = overflowsInY(customAnchorY, currSurfaceHeight);

    if (portal) {
      // Custom anchors have no dimensions
      const portalPositions = getPortalPosition(
        0,
        customAnchorX,
        customAnchorX,
        customAnchorY,
        gapFromAnchor,
        overflowX,
        overflowY
      );

      top = portalPositions.top;
      bottom = portalPositions.bottom;
      left = portalPositions.left;
      right = portalPositions.right;
    } else {
      const nonPortalPositions = getNonPortalPosition(0, currSurfaceWidth, overflowX);
      right = nonPortalPositions.right;
    }

    return { top, bottom, left, right };
  }, [currSurfaceHeight, currSurfaceWidth, customAnchor?.x, customAnchor?.y, gapFromAnchor, portal]);

  const getButtonAnchor = useCallback(() => {
    let top: number | undefined = undefined;
    let bottom: number | undefined = undefined;
    let left: number | undefined = undefined;
    let right: number | undefined = undefined;

    // Ref may change between renders, so we need to instantiate here in the function
    // rather than rely on the component-scoped const
    const buttonRect = buttonRef?.current?.getBoundingClientRect();
    const {
      top: buttonRectTop = 0,
      left: buttonRectLeft = 0,
      right: buttonRectRight = 0,
      width: buttonRectWidth = 0,
      height: buttonRectHeight = 0
    } = buttonRect || {};

    // Whether dropdown overflows in x/y
    const overflowX = isSubmenu
      ? overflowsInX(buttonRectLeft + buttonRectWidth, currSurfaceWidth)
      : overflowsInX(currSurfaceX, currSurfaceWidth);
    const overflowY = overflowsInY(currSurfaceY, currSurfaceHeight);

    if (portal) {
      if (isSubmenu) {
        left = overflowX
          ? buttonRectLeft - currSurfaceWidth - optionMenuPadding + SUBMENU_OVERLAP
          : buttonRectRight + optionMenuPadding - SUBMENU_OVERLAP;
        top = buttonRectTop - optionMenuPadding;
        setSubmenuOpenRight(!overflowX);
      } else {
        const portalPositions = getPortalPosition(
          buttonRectHeight,
          buttonRectLeft,
          buttonRectRight,
          buttonRectTop,
          gapFromAnchor,
          overflowX,
          overflowY
        );

        top = portalPositions.top;
        bottom = portalPositions.bottom;
        left = portalPositions.left;
        right = portalPositions.right;
      }
    } else {
      const nonPortalPosition = getNonPortalPosition(buttonRectWidth, currSurfaceWidth, overflowX);
      right = nonPortalPosition.right;
    }

    return { top, bottom, left, right };
  }, [buttonRef, isSubmenu, currSurfaceWidth, currSurfaceX, currSurfaceY, currSurfaceHeight, portal, gapFromAnchor]);

  useEffect(() => {
    // Do nothing if rect position and dimensions haven't been retrieved yet
    if (
      (!currSurfaceX && !currSurfaceY && !currSurfaceWidth && !currSurfaceHeight) ||
      !!anchor.top ||
      !!anchor.bottom ||
      !!anchor.left ||
      !!anchor.left
    )
      return;

    // Only set an anchor if there is a parent button to set it to
    // or if a custom anchor is passed
    if (!!customAnchor || !!buttonRef) {
      let newAnchor: DropdownAnchor = {};
      if (!!customAnchor) newAnchor = getCustomAnchor();
      else newAnchor = getButtonAnchor();
      setAnchor(newAnchor);
    }
  }, [
    getButtonAnchor,
    currSurfaceRect,
    currSurfaceY,
    currSurfaceX,
    currSurfaceHeight,
    currSurfaceWidth,
    customAnchor,
    getCustomAnchor,
    anchor.top,
    anchor.bottom,
    anchor.left,
    anchor.right,
    buttonRef
  ]);

  // Handles shifting the sub-menu upwards if it overflows in Y
  useEffect(() => {
    if (!isSubmenu || !showDropdown) return;

    const buttonBottom = currButtonRectBottom || 0;
    const surfaceBottom = buttonBottom + currSurfaceHeight - 44;
    // Check if the sub-menu overflows in Y
    const overflowY = surfaceBottom + DROPDOWN_GAP > window.innerHeight;
    // If it overflows in Y, shift it upwards
    if (overflowY) {
      let requiredShift = window.innerHeight - surfaceBottom - DROPDOWN_GAP;
      // If the shifting amount will shift the sub-menu passed the bottom edge of the button,
      // align the lower edge of the sub-menu with the lower edge of the button
      // otherwise, shift normally
      if (surfaceBottom + requiredShift < buttonBottom) {
        const dropdownItemHeight = SIZE_HEIGHT[Size.MEDIUM];
        requiredShift = -currSurfaceHeight + dropdownItemHeight + optionMenuPadding;
      }
      setYShift(requiredShift);
    } else {
      // If it doesn't overflow, reset shifting amount
      setYShift(0);
    }
  }, [setYShift, isSubmenu, showDropdown, currButtonRectBottom, currSurfaceHeight]);

  // Reset anchor
  useEffect(() => {
    if (!showDropdown) setAnchor({});
  }, [showDropdown]);

  if (!showDropdown) return null;

  const renderInputField = (inputField: InputComponent) => (
    <InputFieldContainer>
      {React.cloneElement(inputField, {
        forceTheme,
        borderRadius: inputField.props.borderRadius ?? 6,
        caretColor: inputField.props.caretColor ?? 'primary',
        innerRef: inputField.props.innerRef ?? ((innerRef: HTMLInputElement) => innerRef?.focus()),
        placeholder: inputField.props.placeholder ?? 'Search',
        onFocus: inputField.props.onFocus ?? ((e: React.FocusEvent<HTMLInputElement, Element>) => e.target.select())
      })}
    </InputFieldContainer>
  );

  const renderMenu = () => (
    <div>
      <StyledSurface
        className={className}
        id={id ?? DROPDOWN_CALLER_CLASSNAME}
        $anchor={anchor}
        $width={fullWidth ? currButtonRectWidth : undefined}
        $zIndex={zIndex}
        $defaultLeft={defaultDropdownLeft}
        $defaultTop={defaultDropdownTop}
        $isAnchored={!!buttonRef || !!customAnchor}
        $hideMouse={hideMouse}
        buttonRef={buttonRef}
        classesToIgnore={classesToIgnore}
        hug={!fullWidth}
        level='l2'
        open={showDropdown}
        onClose={(e?: React.MouseEvent) => {
          e?.stopPropagation();
          setShowDropdown(false);
        }}
        optionMenu
        size='full-width'
        setSurfaceRect={setCurrSurfaceRect}
        clickOutsideWebListener={clickOutsideWebListener}
        padding={!noPadding}
        width={width}
        minWidth={minWidth}
        maxWidth={maxWidth}
        forceTheme={forceTheme}
        $maxHeight={maxHeight}
        $yShift={yShift}
        ref={surfaceRef}
      >
        {inputFieldProp && renderInputField(inputFieldProp)}
        {children}
      </StyledSurface>
      {isSubmenu && <MouseSafeArea openRight={!!submenuOpenRight} parentRef={surfaceRef} />}
    </div>
  );

  const renderDropdownContainer = () => (
    <DropdownContainer data-test={dataTest} id={DROPDOWN_CALLER_ID} ref={ref}>
      {portal ? <Portal>{renderMenu()}</Portal> : renderMenu()}
    </DropdownContainer>
  );

  return portal && !isSubmenu ? (
    // Block background actions for primary dropdowns that are portal'd in
    <BackgroundBlocker $top={customBackgroundBlockerPos?.top} $left={customBackgroundBlockerPos?.left}>
      {renderDropdownContainer()}
    </BackgroundBlocker>
  ) : (
    renderDropdownContainer()
  );
}

export default React.forwardRef<HTMLDivElement, DropdownProps>(Dropdown);
