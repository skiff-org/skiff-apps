import { motion, useSpring } from 'framer-motion';
import { ThemeMode } from 'nightwatch-ui';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../theme/AppThemeProvider';

const Centered = styled.div<{ $top?: number; $left?: number; $width?: number | string; $height?: number | string }>`
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  left: ${({ $left }) => ($left ? `${$left}px` : '0')};
  top: ${({ $top }) => ($top ? `${$top}px` : '')};
  width: ${({ $width }) => ($width ? (typeof $width === 'number' ? `${$width}px` : $width) : '100%')};
  height: ${({ $height }) => ($height ? (typeof $height === 'number' ? `${$height}px` : $height) : '100%')};
  z-index: 0;
  overflow: hidden;
`;

const PatternContainer = styled.div``;

interface DottedGridProps {
  isHovered?: boolean;
  top?: number;
  left?: number;
  height?: number | string;
  width?: number | string;
  hideMotionLine?: boolean;
  className?: string;
  noAnimation?: boolean;
}

const DottedGrid = (props: DottedGridProps) => {
  const { isHovered, hideMotionLine, top, left, width, height, className, noAnimation } = props;
  const squareSize = 35;
  const crossSize = 4;
  const padding = 4;
  const gridSize = 20;
  const svgSize = gridSize * (squareSize + 2 * padding);
  const { theme } = useTheme();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [highlightCx, setHighlightCx] = useState(0);
  const [highlightCy, setHighlightCy] = useState(0);
  const highlightRadius = 100;
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!gridRef?.current || noAnimation) return;
    const rect = gridRef?.current?.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setHighlightCx(x);
    setHighlightCy(y);
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    if (typeof window === 'undefined') return;
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const initialRectangleY = windowHeight * 0.37;
  const targetRectangleY = 0;

  // Create a MotionValue instance with useSpring
  const motionVal = useSpring(initialRectangleY);

  useEffect(() => {
    // Set the motion value to the target value
    motionVal.set(isHovered ? targetRectangleY : initialRectangleY);
  }, [isHovered, motionVal, initialRectangleY, targetRectangleY]);

  const orangeColor = useMemo(() => (theme === ThemeMode.DARK ? '#E2806C' : '#EF5A3C'), [theme]);
  const grayColor = useMemo(() => (theme === ThemeMode.DARK ? '#484848' : '#B8B8B8'), [theme]);
  const bgColor = useMemo(() => (theme === ThemeMode.DARK ? '#1f1f1f' : '#fafafa'), [theme]);

  // orange color with 40% opacity
  const orangeColorWithOpacity = useMemo(() => (theme === ThemeMode.DARK ? '#e2806c8f' : '#ef5a3c3C'), [theme]);
  const grayColorWithOpacity = useMemo(() => (theme === ThemeMode.DARK ? '#4848488f' : '#3f3f3f3b'), [theme]);

  const MotionLine = motion.line;
  const MotionRect = motion.rect;

  const renderMiddleLineAndRectangle = useCallback(
    () => (
      <>
        <MotionLine
          stroke={orangeColorWithOpacity}
          strokeWidth='1'
          x1={padding}
          x2={svgSize - padding}
          y1={motionVal}
          y2={motionVal}
        />
        <MotionRect
          fill='url(#linearGradient)'
          height={squareSize + padding * 2}
          width={svgSize - padding * 2}
          x={padding}
          y={motionVal}
        />
      </>
    ),
    [motionVal, padding, svgSize, squareSize, orangeColorWithOpacity]
  );
  const renderGrid = useCallback(
    (color: string) =>
      [...Array<number>(gridSize + 1)].map((_, i: number) => (
        <React.Fragment key={i}>
          <line
            stroke={color}
            strokeDasharray='2.34 2.34'
            strokeWidth='0.3'
            x1={padding + i * (squareSize + padding * 2)}
            x2={padding + i * (squareSize + padding * 2)}
            y1={padding}
            y2={svgSize - padding}
          />
          <line
            stroke={color}
            strokeDasharray='2.34 2.34'
            strokeWidth='0.3'
            x1={padding}
            x2={svgSize - padding}
            y1={padding + i * (squareSize + padding * 2)}
            y2={padding + i * (squareSize + padding * 2)}
          />
        </React.Fragment>
      )),
    []
  );

  const renderCrosses = useCallback(
    (color: string) =>
      [...Array<number>(gridSize)].map((_, i: number) =>
        [...Array<number>(gridSize)].map(
          (_, j: number) =>
            j !== Math.floor(gridSize / 2 - 4) && (
              <React.Fragment key={`${i}-${j}`}>
                <path
                  d={`
                  M ${padding + i * (squareSize + padding * 2) - crossSize / 2 - 2} ${
                    padding + j * (squareSize + padding * 2)
                  }
                  L ${padding + i * (squareSize + padding * 2) + crossSize / 2 + 2} ${
                    padding + j * (squareSize + padding * 2)
                  }
                  M ${padding + i * (squareSize + padding * 2)} ${
                    padding + j * (squareSize + padding * 2) - crossSize / 2 - 2
                  }
                  L ${padding + i * (squareSize + padding * 2)} ${
                    padding + j * (squareSize + padding * 2) + crossSize / 2 + 2
                  }
                `}
                  stroke={bgColor}
                  strokeWidth='10'
                />
                <path
                  d={`
                  M ${padding + i * (squareSize + padding * 2) - crossSize / 2} ${
                    padding + j * (squareSize + padding * 2)
                  }
                  L ${padding + i * (squareSize + padding * 2) + crossSize / 2} ${
                    padding + j * (squareSize + padding * 2)
                  }
                  M ${padding + i * (squareSize + padding * 2)} ${
                    padding + j * (squareSize + padding * 2) - crossSize / 2
                  }
                  L ${padding + i * (squareSize + padding * 2)} ${
                    padding + j * (squareSize + padding * 2) + crossSize / 2
                  }
                `}
                  stroke={color}
                  strokeWidth='0.5'
                />
              </React.Fragment>
            )
        )
      ),
    [bgColor]
  );
  return (
    <Centered className={className} $top={top} $left={left} $width={width} $height={height}>
      <PatternContainer ref={gridRef}>
        <svg height={svgSize} width={svgSize}>
          <defs>
            <radialGradient id='RadialGradient'>
              <stop offset='0%' style={{ stopColor: 'rgb(255,255,255)', stopOpacity: 1 }} />
              <stop offset='100%' style={{ stopColor: 'rgb(255,255,255)', stopOpacity: 0 }} />
            </radialGradient>
            <linearGradient id='horizontalGradient' x1='0' x2='0.5' y1='0' y2='1'>
              <stop offset='0%' style={{ stopColor: 'rgba(239, 90, 60, 0)', stopOpacity: 1 }} />
              <stop offset='20%' style={{ stopColor: 'rgba(239, 90, 60, 0)', stopOpacity: 1 }} />
              <stop offset='100%' style={{ stopColor: 'rgba(239, 90, 60, 0)', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id='verticalGradient' x1='0' x2='0' y1='0' y2='1'>
              <stop offset='0%' style={{ stopColor: 'rgba(239, 90, 60, 0.1)', stopOpacity: 1 }} />
              <stop offset='100%' style={{ stopColor: 'rgba(239, 90, 60, 0)', stopOpacity: 1 }} />
            </linearGradient>
            <pattern height='1' id='linearGradient' preserveAspectRatio='none' viewBox='0,0,1,1' width='1' x='0' y='0'>
              <rect fill='url(#horizontalGradient)' height='1' width='0.75' x='0' y='0' />
              <rect fill='url(#verticalGradient)' height='1' width='1' x='0' y='0' />
            </pattern>
            <mask height='100%' id='Mask' width='100%' x='0' y='0'>
              <rect fill='url(#RadialGradient)' height='100%' width='100%' x='0' y='0' />
            </mask>
            <mask id='CircleMask'>
              <rect fill='black' height='100%' width='100%' />
              <circle cx={highlightCx} cy={highlightCy} fill='white' r={highlightRadius} />
            </mask>
          </defs>
          <g mask='url(#Mask)'>
            <g>{renderGrid(isHovered ? grayColorWithOpacity : grayColor)}</g>
            <g mask='url(#CircleMask)'>{renderGrid(isHovered ? grayColorWithOpacity : orangeColor)}</g>
            <g>{renderCrosses(isHovered ? grayColorWithOpacity : grayColor)}</g>
            <g mask='url(#CircleMask)'>{renderCrosses(isHovered ? grayColorWithOpacity : orangeColor)}</g>
            {!hideMotionLine && <g>{renderMiddleLineAndRectangle()}</g>}
          </g>
        </svg>
      </PatternContainer>
    </Centered>
  );
};

export default memo(DottedGrid);
