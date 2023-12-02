import { LayoutGroup, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import { Alignment, Size, ThemeMode } from '../../types';
import { getThemedColor } from '../../utils/colorUtils';
import Typography, { TypographyWeight } from '../Typography';

import Icons from '../Icons';
import { SLIDER_ANIMATION_DURATION, TabsProps, TabsSize, TYPOGRAPHY_SIZE } from './Tabs.constants';
import { SLIDER_CSS, TAB_CELL_CSS, TABS_CONTAINER_CSS } from './Tabs.styles';

const TabsContainer = styled(motion.ul)<{ $size: TabsSize; $forceTheme?: ThemeMode; $fullWidth?: boolean }>`
  display: flex;
  align-items: center;
  list-style-type: none;

  margin: 0;
  padding: 4px;
  box-sizing: border-box;

  background: ${(props) => getThemedColor('var(--bg-field-default)', props.$forceTheme)};
  width: ${(props) => (props.$fullWidth || isMobile ? '100%' : 'fit-content')};

  ${TABS_CONTAINER_CSS}
`;

const TabCell = styled(motion.li)<{ $size: TabsSize; $isClickable: boolean }>`
  width: 100%;
  position: relative;
  isolation: isolate;

  cursor: ${(props) => (props.$isClickable ? 'pointer' : 'default')};

  ${TAB_CELL_CSS}
`;

const Slider = styled(motion.div)<{ $size: TabsSize; $forceTheme?: ThemeMode }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: -1;

  height: 100%;

  background: ${(props) => getThemedColor('var(--bg-l3-solid)', props.$forceTheme)};
  box-shadow: ${(props) => getThemedColor('var(--shadow-l1)', props.$forceTheme)};

  ${SLIDER_CSS}
`;

/**
 * Component that renders tabs to filter between two or more pages.
 */
const Tabs: React.FC<TabsProps> = ({ tabs, forceTheme, fullWidth, size = Size.MEDIUM }: TabsProps) => {
  const typographySize = TYPOGRAPHY_SIZE[size];

  // Whether or not the component has mounted
  const [isLoaded, setIsLoaded] = useState(false);

  // Needed to disable the slider animation on mount
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <TabsContainer $forceTheme={forceTheme} $fullWidth={fullWidth} $size={size}>
      {tabs.map(({ active, label, onClick, icon }) => (
        <TabCell key={label} onClick={onClick} $isClickable={!!onClick && !active} $size={size}>
          <LayoutGroup>
            {icon && <Icons size={16} color={active ? 'secondary' : 'disabled'} icon={icon} />}
            {label && (
              <Typography
                align={Alignment.CENTER}
                color={active ? 'primary' : 'disabled'}
                size={typographySize}
                selectable={false}
                weight={TypographyWeight.MEDIUM}
                forceTheme={forceTheme}
                transition={`color ${SLIDER_ANIMATION_DURATION}s ease`}
              >
                {label}
              </Typography>
            )}
            {active && (
              <Slider
                layout={isLoaded ? undefined : 'size'}
                layoutId='slider'
                $forceTheme={forceTheme}
                transition={{ duration: SLIDER_ANIMATION_DURATION }}
                $size={size}
              />
            )}
          </LayoutGroup>
        </TabCell>
      ))}
    </TabsContainer>
  );
};

export default Tabs;
