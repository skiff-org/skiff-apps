import './Surface.scss';

import { AnimatePresence, motion, usePresence } from 'framer-motion';
import React, { ForwardedRef, MutableRefObject, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { useOnClickOutside, useOnEscapePress } from '../../hooks';
import { DISPLAY_SCROLLBAR_CSS } from '../../styles';
import { themeNames } from '../../theme';
import { MouseClickEvents, Size, ThemeMode } from '../../types';
import Portal from '../Portal';

import {
  ALWAYS_IGNORED_OFFCLICK_CLASSES,
  MODAL_AND_DROPDOWN_SELECTOR,
  MODAL_CLASSNAME,
  OPTION_MENU_CLASSNAME,
  SCRIM_CLASSNAME,
  SURFACE_CLASSNAME,
  SURFACE_ENTRANCE_EXIT_TRANSITION_TIME
} from './Surface.constants';

export const optionMenuPadding = 4;

const getLevelStyles = (level: 'l0' | 'l1' | 'l2' | 'l3', forceTheme?: ThemeMode) => {
  switch (level) {
    case 'l3':
      return {
        solidBackground: forceTheme ? themeNames[forceTheme]['--bg-l3-solid'] : 'var(--bg-l3-solid)',
        glassBackground: forceTheme ? themeNames[forceTheme]['--bg-l3-glass'] : 'var(--bg-l3-glass)',
        boxShadow: forceTheme ? themeNames[forceTheme]['--shadow-l3'] : 'var(--shadow-l3)',
        position: 'relative'
      };
    case 'l2':
      return {
        solidBackground: forceTheme ? themeNames[forceTheme]['--bg-l2-solid'] : 'var(--bg-l2-solid)',
        glassBackground: forceTheme ? themeNames[forceTheme]['--bg-l2-glass'] : 'var(--bg-l2-glass)',
        boxShadow: forceTheme ? themeNames[forceTheme]['--shadow-l2'] : 'var(--shadow-l2)',
        position: 'absolute'
      };
    case 'l1':
      return {
        solidBackground: forceTheme ? themeNames[forceTheme]['--bg-l1-solid'] : 'var(--bg-l1-solid)',
        glassBackground: forceTheme ? themeNames[forceTheme]['--bg-l1-glass'] : 'var(--bg-l1-glass)',
        boxShadow: 'none',
        position: 'inherit'
      };
    case 'l0':
    default:
      return {
        solidBackground: forceTheme ? themeNames[forceTheme]['--bg-l0-solid'] : 'var(--bg-l0-solid)',
        glassBackground: forceTheme ? themeNames[forceTheme]['--bg-l0-glass'] : 'var(--bg-l0-glass)',
        boxShadow: 'none',
        position: 'inherit'
      };
  }
};

const getWidthFromSize = (size: Size | 'full-width' | 'full-screen') => {
  switch (size) {
    case Size.X_SMALL:
      return '320px';
    case Size.SMALL:
      return '384px';
    case Size.MEDIUM:
      return '448px';
    case Size.X_MEDIUM:
      return '512px';
    case Size.LARGE:
      return '768px';
    case Size.X_LARGE:
      return '1200px';
    case 'full-screen':
      return '100vw';
    case 'full-width':
    default:
      return '100%';
  }
};

const getHeightFromSize = (size: Size | 'full-width' | 'full-screen') => {
  if (size === 'full-screen') return '100vh';
  return 'auto';
};

const getMaxWidthFromSize = (size: Size | 'full-width' | 'full-screen') => {
  if (size === 'full-screen') return '100vw';
  return '95vw';
};

const StyledSurface = styled.div<{
  level: 'l0' | 'l1' | 'l2' | 'l3';
  size: Size | 'full-width' | 'full-screen';
  forceTheme?: ThemeMode;
  $disableTextSelect?: boolean;
  $height?: number | string;
  $maxWidth?: number | string;
  $minWidth?: number | string;
  $width?: number | string;
}>`
  ${DISPLAY_SCROLLBAR_CSS}

  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px;
  gap: 8px;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid
    ${(props) => {
      if (props.size === 'full-screen') {
        return 'none';
      }
      return props.forceTheme ? themeNames[props.forceTheme]['--border-secondary'] : 'var(--border-secondary)';
    }};
  z-index: 999;
  min-width: ${({ $minWidth }) => {
    if (!$minWidth) return '185px';
    return `${typeof $minWidth === 'string' ? $minWidth : `${$minWidth}px`} !important`;
  }};

  max-width: ${({ $maxWidth, size }) => {
    if (!$maxWidth) return getMaxWidthFromSize(size);
    return `${typeof $maxWidth === 'string' ? $maxWidth : `${$maxWidth}px`} !important`;
  }};

  &.padding {
    padding: 20px;
  }
  &.noPadding {
    padding: 0px !important;
  }
  &.optionMenu {
    padding: ${optionMenuPadding}px;
    gap: 0px;
  }
  &.modal {
    gap: 16px;
  }
  &.hoverEffect:hover {
    border: 1px solid ${(props) => getLevelStyles(props.level, props.forceTheme).solidBackground};
    cursor: pointer;
  }
  &.solid {
    background: ${(props) => getLevelStyles(props.level, props.forceTheme).solidBackground};
  }
  &.solid.dark {
    background: ${(props) => (props.forceTheme ? themeNames[props.forceTheme]['--bg-emphasis'] : 'var(--bg-emphasis)')};
  }
  &.glass {
    background: ${(props) => getLevelStyles(props.level, props.forceTheme).glassBackground};
  }
  box-shadow: ${(props) => getLevelStyles(props.level, props.forceTheme).boxShadow};
  &.disableShadow {
    box-shadow: none;
  }
  position: ${(props) => getLevelStyles(props.level, props.forceTheme).position};
  width: ${({ $width, size }) => {
    if (!$width) return getWidthFromSize(size);
    return `${typeof $width === 'string' ? $width : `${$width}px`} !important`;
  }};
  height: ${({ $height, size }) => {
    if (!$height) return getHeightFromSize(size);
    return `${typeof $height === 'string' ? $height : `${$height}px`} !important`;
  }};
  &.hug {
    max-width: ${(props) => (props.size !== 'full-width' ? getWidthFromSize(props.size) : '')};
    min-width: 112px;
    width: unset;
  }

  ${({ $disableTextSelect }) => $disableTextSelect && 'user-select: none;'}
`;

export interface SurfaceProps {
  id?: string;
  /** The elevation of the Surface */
  level?: 'l0' | 'l1' | 'l2' | 'l3';
  /** The width of the Surface */
  size?: Size | 'full-width' | 'full-screen';
  /** The size is a max-width instead of width */
  hug?: boolean;
  /** Surface child component */
  children?: React.ReactNode;
  /** Place scrim behind the surface (l3 only) */
  scrim?: boolean;
  optionMenu?: boolean; // option padding for dropdowns
  modal?: boolean; // modal padding for dialog
  open?: boolean;
  dataTest?: string;
  disableOffClick?: boolean;
  disableTextSelect?: boolean;
  hoverEffect?: boolean;
  onClose?: () => Promise<void> | void;
  glass?: boolean; // glass effect
  style?: React.CSSProperties;
  padding?: boolean;
  className?: string;
  forceTheme?: ThemeMode;
  classesToIgnore?: string[];
  disableShadow?: boolean;
  buttonRef?: MutableRefObject<HTMLDivElement | null>;
  setSurfaceRect?: (arg: { width: number; height: number; x: number; y: number }) => void;
  zIndex?: number;
  clickOutsideWebListener?: MouseClickEvents;
  /** Custom height */
  height?: number | string;
  /** Custom width */
  width?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
}

function Surface(
  {
    id,
    level = 'l1',
    size = Size.MEDIUM,
    onClose,
    open = true,
    optionMenu,
    modal,
    children,
    hoverEffect,
    dataTest,
    disableOffClick,
    disableTextSelect,
    scrim,
    glass,
    style,
    padding = true,
    className = '',
    hug = false,
    forceTheme,
    classesToIgnore = [],
    disableShadow,
    buttonRef,
    setSurfaceRect,
    zIndex,
    clickOutsideWebListener,
    height,
    width,
    minWidth,
    maxWidth
  }: SurfaceProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const [showSurface, setShowSurface] = useState(true);
  const [isPresent, safeToRemove] = usePresence();

  // handle outside clicks
  const wrapperRef = useRef<HTMLDivElement>(null);
  const surfaceRef = ref ? (ref as MutableRefObject<HTMLDivElement>) : wrapperRef;

  const onCloseSurface = () => {
    if (!!onClose) void onClose();
    else setShowSurface(false);
  };

  // we delay unmounting for the time needed by the exit animation
  useEffect(() => {
    if (!isPresent) setTimeout(safeToRemove, SURFACE_ENTRANCE_EXIT_TRANSITION_TIME);
  }, [isPresent, safeToRemove]);

  useEffect(() => {
    if (!surfaceRef?.current || !setSurfaceRect) return;
    setSurfaceRect({
      width: surfaceRef.current?.clientWidth || 0,
      height: surfaceRef.current?.clientHeight || 0,
      x: surfaceRef.current.getBoundingClientRect().x || 0,
      y: surfaceRef.current.getBoundingClientRect().y || 0
    });
    // reset surfaceRect state on unmount
    return () => {
      if (!!setSurfaceRect) setSurfaceRect({ width: 0, height: 0, x: 0, y: 0 });
    };
  }, [surfaceRef, buttonRef, setSurfaceRect]);
  // close the sub-menu if the cursor moves away from the safe area
  useEffect(() => {
    if (!open && !showSurface) onCloseSurface();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, showSurface]);

  useOnClickOutside(
    surfaceRef,
    () => {
      onCloseSurface();
    },
    [...ALWAYS_IGNORED_OFFCLICK_CLASSES, ...classesToIgnore],
    { web: clickOutsideWebListener },
    [buttonRef],
    disableOffClick
  );

  // close on escape for dropdowns and modals
  useOnEscapePress(surfaceRef, MODAL_AND_DROPDOWN_SELECTOR, onCloseSurface);

  const renderSurface = () => (
    <StyledSurface
      id={id}
      level={level}
      size={size}
      ref={surfaceRef}
      className={`${SURFACE_CLASSNAME} ${glass ? 'glass' : 'solid'} ${disableShadow ? 'disableShadow' : ''} ${
        padding ? 'padding' : 'noPadding'
      } ${!!optionMenu ? OPTION_MENU_CLASSNAME : ''} ${modal ? MODAL_CLASSNAME : ''} ${
        hoverEffect ? 'hoverEffect' : ''
      } ${className} ${hug ? 'hug' : ''} ${forceTheme ? forceTheme : ''}`}
      style={style}
      data-test={dataTest}
      forceTheme={forceTheme}
      $disableTextSelect={disableTextSelect}
      $height={height}
      $width={width}
      $minWidth={minWidth}
      $maxWidth={maxWidth}
      onClick={(e?: React.MouseEvent) => {
        e?.stopPropagation();
      }}
    >
      {children}
    </StyledSurface>
  );

  if (!showSurface) return null;

  if (scrim && level === 'l3') {
    return (
      <Portal>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: SURFACE_ENTRANCE_EXIT_TRANSITION_TIME / 1000 }}
              className={SCRIM_CLASSNAME}
              style={{ zIndex: zIndex }}
            >
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.95 }}
                transition={{ ease: [0.16, 1, 0.3, 1], duration: SURFACE_ENTRANCE_EXIT_TRANSITION_TIME / 1000 }}
                className='mobile-avoiding-keyboard'
              >
                {renderSurface()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    );
  } else {
    return <>{open && renderSurface()}</>;
  }
}

export default React.forwardRef<HTMLDivElement, SurfaceProps>(Surface);
