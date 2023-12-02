import React, { ForwardedRef, MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import styled, { css } from 'styled-components';

import { SIZE_HEIGHT } from '../../constants';
import { themeNames } from '../../theme';
import { KeyboardEvents, Size, ThemeMode } from '../../types';
import Icons, { Icon } from '../Icons';
import IconText from '../IconText/IconText';
import { ICON_TEXT_ICON_SIZE } from '../IconText/IconText.constants';
import { DROPDOWN_CALLER_CLASSNAME } from '../Surface';
import { TypographyWeight } from '../Typography';

import { INITIAL_SCROLL_INTO_VIEW_TIMEOUT } from './DropdownItem.constants';
import { DROPDOWN_ITEM_ICON_CSS } from './DropdownItem.styles';
import { DropdownItemProps, DropdownItemSize } from './DropdownItem.types';

const DropdownItemContainer = styled.div<{
  $hovering: boolean;
  $size: DropdownItemSize;
  $hideDivider?: boolean;
  $noPadding?: boolean;
}>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  ${(props) => !props.$noPadding && 'padding: 8px;'};
  box-sizing: border-box;

  width: 100%;
  border-radius: 6px;
  height: ${(props) => SIZE_HEIGHT[props.$size]}px;

  ${({ $hideDivider }) =>
    isMobile &&
    css`
      padding: 16px;
      height: 56px !important;
      box-sizing: border-box;
      border-bottom: 1px solid ${$hideDivider === false ? themeNames.dark['--border-tertiary'] : 'transparent'};
    `}

  background: transparent;
  ${(props) =>
    props.$hovering &&
    `
      cursor: pointer;
      background: ${themeNames.dark['--bg-overlay-tertiary']};
    `}
`;

const DropdownItemHeader = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
  min-width: 0px;
  flex: 1;
`;

const IconTextContainer = styled.div`
  min-width: 0px;
  ${DROPDOWN_ITEM_ICON_CSS}
`;

const DropdownItemTail = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const Label = styled.div<{ $hovering: boolean }>`
  opacity: ${(props) => (props.$hovering ? 1 : 0.9)};
`;

const IconContainer = styled.div`
  ${DROPDOWN_ITEM_ICON_CSS}
`;

function DropdownItem(
  {
    label,
    active = false,
    color = 'primary',
    customLabel,
    dataTest,
    disabled = false,
    endElement,
    showEndElement = !!endElement && !isMobile,
    hideDivider,
    highlight,
    noPadding = false,
    onHover,
    icon,
    scrollIntoView = false,
    size = Size.MEDIUM,
    startElement,
    onClick
  }: DropdownItemProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const [hover, setHover] = useState(false);
  // Dropdown item ref
  // Used to scroll dropdown item into view in case a ref wasn't already forwarded
  const dropdownItemRef = useRef<HTMLDivElement>(null);

  const clickable = !!onClick && !disabled;
  const contentColor = disabled ? 'disabled' : color;
  const forceTheme = ThemeMode.DARK;
  const iconTextSize = isMobile ? Size.LARGE : Size.MEDIUM;
  const iconSize = ICON_TEXT_ICON_SIZE[iconTextSize];
  const hovering = clickable && ((highlight === undefined && hover) || !!highlight);

  const onDropdownItemClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!clickable) return;
    // Prevent mouse event from bubbling up to the parent
    // Important for Calendar where mousedown events are registered on the calendar
    e.preventDefault();
    e.stopPropagation();
    void onClick(e);
  };

  const renderLabel = () => customLabel ?? <Label $hovering={hovering}>{label}</Label>;

  // Scrolls the dropdown item into view
  const runScrollIntoView = useCallback(() => {
    if (
      (!ref && !dropdownItemRef) ||
      (!scrollIntoView && !highlight) ||
      // Since a defined highlight prop means that keyboard navigation is currently active
      // highlight === false means that another item in the dropdown is currently highlighted
      // so we don't scroll the current item into view even if the scrollIntoView prop is true
      (scrollIntoView && highlight === false)
    )
      return;
    const mutableRef = ref ? (ref as MutableRefObject<HTMLDivElement>) : dropdownItemRef;
    const target = mutableRef.current;
    // Do nothing if the item was highlighted on hover
    if (!target || (highlight && target.matches(':hover'))) return;

    // We check for highlight first in case keyboard navigation is currently active
    // so we'd only want to scroll the current item to nearest instead of to center
    target.scrollIntoView({ block: highlight ? 'nearest' : 'center' });
  }, [dropdownItemRef, highlight, ref, scrollIntoView]);

  useEffect(() => {
    const parentDropdown = document.getElementById(DROPDOWN_CALLER_CLASSNAME);
    const isDropdownHidden = !parentDropdown || window.getComputedStyle(parentDropdown).visibility === 'hidden';
    const timeout = isDropdownHidden ? INITIAL_SCROLL_INTO_VIEW_TIMEOUT : 0;
    // scrollIntoView after timeout to await initial dropdown anchoring
    // Needed to prevent the whole page from moving when the hidden unanchored dropdown overflows
    setTimeout(() => {
      runScrollIntoView();
    }, timeout);
  }, [runScrollIntoView]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' && clickable) {
        e.preventDefault();
        e.stopPropagation();
        void onClick();
      }
    },
    [clickable, onClick]
  );

  useEffect(() => {
    if (!highlight) return;
    window.addEventListener(KeyboardEvents.KEY_DOWN, onKeyDown);
    return () => {
      window.removeEventListener(KeyboardEvents.KEY_DOWN, onKeyDown);
    };
  }, [highlight, onKeyDown]);

  return (
    <DropdownItemContainer
      data-test={dataTest}
      onClick={onDropdownItemClick}
      ref={ref ?? dropdownItemRef}
      $hovering={hovering}
      $size={size}
      $hideDivider={hideDivider}
      $noPadding={noPadding}
      onMouseOver={() => {
        if (!clickable) return;
        setHover(true);
        if (onHover) onHover();
      }}
      onMouseLeave={() => {
        if (!clickable) return;
        setHover(false);
      }}
      // Prevent mouse event from bubbling up to the parent
      // Important for Calendar where mousedown events are registered on the calendar
      onMouseUp={(e) => {
        if (!clickable) return;
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        if (!clickable) return;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <DropdownItemHeader>
        {startElement}
        <IconTextContainer $hovering={hovering}>
          <IconText
            color={contentColor}
            label={renderLabel()}
            size={iconTextSize}
            startIcon={icon}
            weight={TypographyWeight.REGULAR}
            forceTheme={forceTheme}
            noPadding
          />
        </IconTextContainer>
      </DropdownItemHeader>
      {(active || showEndElement) && (
        <DropdownItemTail>
          {active && (
            <IconContainer $hovering={hovering}>
              <Icons icon={Icon.Check} size={iconSize} color={contentColor} forceTheme={forceTheme} />
            </IconContainer>
          )}
          {showEndElement && endElement}
        </DropdownItemTail>
      )}
    </DropdownItemContainer>
  );
}

export default React.forwardRef<HTMLDivElement, DropdownItemProps>(DropdownItem);
