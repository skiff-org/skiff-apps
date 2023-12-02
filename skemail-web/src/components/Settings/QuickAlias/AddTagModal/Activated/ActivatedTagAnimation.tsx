import { AnimatePresence, motion } from 'framer-motion';
import range from 'lodash/range';
import { Icon, IconText, ThemeMode, Typography, TypographySize } from 'nightwatch-ui';
import React, { useEffect, useState } from 'react';
import { useQuickAliasForUserDefaultDomain, useToast } from 'skiff-front-utils';
import styled from 'styled-components';

import QuickAliasRotatingTag from '../../QuickAliasRotatingTag';

const CopyButtonContainer = styled.div`
  position: relative;
  z-index: 99999;
`;

const SubdomainActiveInputContainer = styled(motion.div)<{ $animated?: boolean }>`
  display: flex;
  align-items: center;
  border: 1.5px solid ${(props) => (props.$animated ? 'rgba(255, 255, 255, 0.5)' : 'var(--border-secondary)')};
  border-radius: 12px;
  padding: 12px;
  box-sizing: border-box;
  box-shadow: var(--shadow-l2);
  background: var(--bg-emphasis);
  height: 46px;
  transition: border-color 0.2s ease-in-out;
  :hover {
    border-color: white;
  }
`;

const Relative = styled.div`
  position: relative;
  left: -13px;
  top: -23px;
`;

const Pulse = styled(motion.div)<{ $path: string; $opacity: number }>`
  width: 2px;
  border-radius: 10px;
  height: 2px;
  background: ${({ $opacity }) => `rgba(255, 255, 255, ${$opacity})`};
  position: absolute;
  top: 0;
  left: 0;
  offset-path: ${({ $path }) => `path('${$path}')`};
`;

const CursorCircle = styled.div`
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  filter: blur(12px);
  pointer-events: none;
  transform: translate(-50%, -50%);
  transition: transform 0.1s, opacity 0.1s;
  opacity: 0;
`;

const StyledTypography = styled(Typography)`
  width: 100%;
`;

const NUM_PULSE = 40;

interface ActivatedTagAnimationProps {
  subdomain: string;
  showAddr?: boolean;
  hideCopyButton?: boolean;
}

export default function ActivatedTagAnimation(props: ActivatedTagAnimationProps) {
  const { showAddr, subdomain, hideCopyButton } = props;

  const { data: defaultDomain } = useQuickAliasForUserDefaultDomain();

  const { enqueueToast } = useToast();
  const containerRef = React.useRef<HTMLDivElement>(null); // Ref for the SubdomainInputContainer

  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [path, setPath] = useState('');

  useEffect(() => {
    const updatePath = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight - 1;
        const r = 12; // border-radius value

        // Considerations for the cubic bezier curve
        const c = r * (1 - 0.552284749831);

        const newPath = `
          M ${r} 0
          H ${width - r}
          C ${width - c} 0, ${width} 0, ${width} ${r}
          V ${height - r}
          C ${width} ${height - c}, ${width} ${height}, ${width - r} ${height}
          H ${r}
          C ${c} ${height}, 0 ${height}, 0 ${height - r}
          V ${r}
          C 0 ${c}, 0 0, ${r} 0
        `;
        setPath(newPath);
      }
    };

    // Initial path update
    updatePath();

    // Set up ResizeObserver
    const resizeObserver = new ResizeObserver(updatePath);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Clean up
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  const onCopy = () => {
    void navigator.clipboard.writeText(`@${subdomain}.${defaultDomain}`);
    enqueueToast({
      title: 'Copied to clipboard',
      body: `@${subdomain}.${defaultDomain} has been copied to your clipboard`
    });
  };

  return (
    <>
      <CursorCircle
        style={{
          left: cursorPosition.x - 330,
          top: cursorPosition.y - 250,
          opacity: isHovered ? 1 : 0
        }}
      />
      <SubdomainActiveInputContainer
        $animated
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={(e) => {
          setCursorPosition({ x: e.clientX, y: e.clientY });
        }}
        ref={containerRef}
      >
        <Relative>
          <AnimatePresence>
            {!isHovered &&
              range(NUM_PULSE).map((i) => {
                return (
                  <Pulse
                    $opacity={1 - i * (1 / NUM_PULSE)}
                    $path={path}
                    key={i}
                    animate={{ offsetDistance: '100%' }}
                    initial={{ offsetDistance: `${(NUM_PULSE - i) * 0.3}%` }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'linear',
                      repeatDelay: 0
                    }}
                  />
                );
              })}
          </AnimatePresence>
        </Relative>
        {showAddr && <QuickAliasRotatingTag color='white' size={TypographySize.LARGE} />}
        <StyledTypography color='white' size={TypographySize.LARGE}>
          {`@${subdomain}.${defaultDomain}`}
        </StyledTypography>
        {!hideCopyButton && (
          <CopyButtonContainer>
            <IconText color='secondary' forceTheme={ThemeMode.DARK} onClick={onCopy} startIcon={Icon.Copy} />
          </CopyButtonContainer>
        )}
      </SubdomainActiveInputContainer>
    </>
  );
}
