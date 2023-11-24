import { DraggableProps, HTMLMotionProps, motion, MotionValue, useDragControls } from 'framer-motion';
import React, { RefObject, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useLongTouch } from 'skiff-front-utils';
import styled, { css } from 'styled-components';

import { CARD_CONTENT_MARGIN, SNAP_SIZE } from '../../../constants/calendar.constants';
import { FIFTEEN_MIN, FORTY_MIN, SECONDS_IN_MIN } from '../../../constants/time.constants';

const LONG_TOUCH_DURATION = 300;

export enum DragType {
  None = 'none',
  Top = 'top',
  Bottom = 'bottom',
  All = 'all'
}

interface BaseDragContainerProps {
  type: DragType;
  onDragEnd: (e: DragEvent) => void;
  dragY: MotionValue<number>;
  currentDragType: DragType | null;
  onLongTouch: (e: MouseEvent | TouchEvent) => void;
  onDragStart: (dragType: DragType) => void;
  duration: number;
  canDrag?: boolean;
  shouldDragContainerBeFullHeight?: boolean;
  constraintsRef?: RefObject<HTMLDivElement>;
  eventCardRef?: RefObject<HTMLDivElement>;
}

interface TopBottomDragProps extends BaseDragContainerProps {
  type: DragType.Top | DragType.Bottom;
  onClick?: (e: React.MouseEvent) => void;
}

interface AllDragProps extends BaseDragContainerProps {
  type: DragType.All;
  dragX: MotionValue<number>;
  onClick?: (e: React.MouseEvent) => void;
}

type DragContainerProps = TopBottomDragProps | AllDragProps;

type DragMotionProps = {
  $componentDragType: DragType;
  $currentDragType: DragType | null;
  $duration: number;
  $shouldDragContainerBeFullHeight?: boolean;
};
const RESIZE_CONTAINER_HEIGHT = 8;
const ACTIVE_RESIZE_CONTAINER_HEIGHT = RESIZE_CONTAINER_HEIGHT * 4;

const getDragHeight = (dragType: DragType | null) =>
  dragType !== DragType.None ? ACTIVE_RESIZE_CONTAINER_HEIGHT * 4 : RESIZE_CONTAINER_HEIGHT;

const getDragMargin = (
  dragType: DragType | null,
  duration: number,
  shouldDragContainerBeFullHeight: boolean,
  marginTop?: boolean
) => {
  const isTall = duration > FORTY_MIN * SECONDS_IN_MIN;
  const isTiny = duration <= FIFTEEN_MIN * SECONDS_IN_MIN;
  const isBetween = !isTiny && !isTall;
  if (dragType === DragType.None && isTall) return marginTop ? -RESIZE_CONTAINER_HEIGHT : RESIZE_CONTAINER_HEIGHT;
  if (isBetween) return -RESIZE_CONTAINER_HEIGHT;
  if (isTall && !shouldDragContainerBeFullHeight) return -ACTIVE_RESIZE_CONTAINER_HEIGHT;
  if (isTiny) return 0;
  return RESIZE_CONTAINER_HEIGHT;
};

const DragMotion = styled(motion.div)<DragMotionProps>`
  margin-left: -${CARD_CONTENT_MARGIN}px;
  ${({ $componentDragType, $currentDragType, $shouldDragContainerBeFullHeight, $duration }) => {
    switch ($componentDragType) {
      case DragType.Top:
        return css`
          margin-top: ${getDragMargin($currentDragType, $duration, !!$shouldDragContainerBeFullHeight, true)}px;
          height: ${getDragHeight($currentDragType)}px;
          cursor: ns-resize;
        `;
      case DragType.Bottom:
        return css`
          margin-bottom: ${getDragMargin($currentDragType, $duration, !!$shouldDragContainerBeFullHeight)}px;
          height: ${getDragHeight($currentDragType)}px;
          cursor: ns-resize;
        `;
      case DragType.All:
        return css`
          height: ${$shouldDragContainerBeFullHeight ? '100%' : `calc(100% - ${RESIZE_CONTAINER_HEIGHT * 2}px)`};
          cursor: ${$currentDragType === 'all' ? 'move' : 'unset'};
        `;
    }
  }}
`;

const DEBUG_HITBOX = false; // Set to true when you need to debug dragging
export default function DragContainer(props: DragContainerProps) {
  const {
    type,
    onDragEnd,
    dragY,
    currentDragType,
    onClick,
    canDrag = true,
    onLongTouch,
    onDragStart,
    shouldDragContainerBeFullHeight,
    duration,
    constraintsRef,
    eventCardRef
  } = props;
  const ref = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const [constraints, setConstraints] = useState<{ bottom?: number; top?: number }>({});

  // For Dependency Array
  const bottomDep = eventCardRef?.current?.getBoundingClientRect().bottom;
  const topDep = eventCardRef?.current?.getBoundingClientRect().top;
  const heightDep = eventCardRef?.current?.getBoundingClientRect().height;

  useEffect(() => {
    if (constraintsRef?.current && eventCardRef?.current) {
      const containerBox = constraintsRef.current.getBoundingClientRect();
      const draggableBox = eventCardRef.current.getBoundingClientRect();
      const bottom = containerBox.bottom - draggableBox.bottom + draggableBox.height - SNAP_SIZE - 5;
      const top = containerBox.top - draggableBox.top - draggableBox.height - SNAP_SIZE;
      setConstraints({ bottom, top });
    }
  }, [constraintsRef, bottomDep, topDep, heightDep, eventCardRef, type]);

  useLongTouch(
    ref,
    (e) => {
      onLongTouch(e);
      dragControls.start(e);
    },
    type === DragType.All || isMobile ? LONG_TOUCH_DURATION : 0, // Duration
    !isMobile, // Ignore move - on mobile cancel long touch when mouse moves
    false // Passive
  );

  if (!canDrag) return null;

  const onClickWithPreventDefault: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    if (onClick) {
      onClick(e);
    }
  };

  const sharedDragProps: Partial<DraggableProps & HTMLMotionProps<'div'>> & DragMotionProps = {
    _dragY: dragY,
    dragMomentum: false,
    onDragEnd,
    onClick: onClickWithPreventDefault,
    $currentDragType: currentDragType,
    $componentDragType: type,
    dragListener: false,
    dragControls,
    onDragStart: () => onDragStart(type),
    $duration: duration,
    $shouldDragContainerBeFullHeight: shouldDragContainerBeFullHeight
  };

  if (type === DragType.All) {
    const { dragX } = props;
    return (
      <DragMotion
        {...sharedDragProps}
        _dragX={dragX}
        drag={isMobile ? 'y' : true}
        dragConstraints={constraints}
        dragElastic={0}
        id={type}
        ref={ref}
        style={
          DEBUG_HITBOX
            ? {
                border: `1px solid #${Math.floor(Math.random() * 16777215).toString(16)}`
              }
            : undefined
        }
      />
    );
  } else if (type === DragType.Top || type === DragType.Bottom) {
    return (
      <DragMotion
        id={type}
        {...sharedDragProps}
        drag='y'
        dragConstraints={constraints}
        dragElastic={0}
        ref={ref}
        style={DEBUG_HITBOX ? { border: `1px solid #${Math.floor(Math.random() * 16777215).toString(16)}` } : undefined}
      />
    );
  }
  return null;
}
