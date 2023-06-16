import { motion, useMotionValue, useTransform } from 'framer-motion';
import React from 'react';
import styled from 'styled-components';

interface AnimatedCopyIconProps {
  isClicked: boolean;
}

// Necessary to counter Safari-specific issue for sizing svg's
const SVGContainer = styled.div`
  max-height: 24px;
  max-width: 24px;
`;

const ANIMATION_DURATION = 0.4;

const AnimatedCopyIcon: React.FC<AnimatedCopyIconProps> = ({ isClicked }) => {
  const pathLength = useMotionValue(0);
  const opacity = useTransform(pathLength, [0, 0.25, 0.5], [0, 0, 1]);

  return (
    <SVGContainer>
      <svg fill='none' height='24' viewBox='0 0 24 24' width='24' xmlns='https://www.w3.org/2000/svg'>
        <motion.path
          animate={isClicked ? 'clicked' : 'unclicked'}
          d='M4 17V4C4 3.44772 4.44772 3 5 3H16'
          initial={false}
          stroke='var(--icon-secondary)'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='1.5'
          transition={{ duration: isClicked ? ANIMATION_DURATION * 0.5 : ANIMATION_DURATION * 2 }}
          variants={{
            unclicked: { opacity: 1 },
            clicked: { opacity: 0 }
          }}
        />
        <motion.path
          animate={isClicked ? 'clicked' : 'unclicked'}
          initial={false}
          stroke='var(--icon-secondary)'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='1.5'
          transition={{ duration: ANIMATION_DURATION * 2, ease: [0.04, 0.62, 0.23, 0.98] }}
          variants={{
            unclicked: { d: 'M8 7H20V20C20 20.5523 19.5523 21 19 21H8V7Z' },
            clicked: { d: 'M7 12L10 15L17 8' }
          }}
        />
        <motion.circle
          animate={isClicked ? 'clicked' : 'unclicked'}
          cx='12'
          cy='12'
          initial={false}
          r='9'
          stroke='var(--icon-secondary)'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='1.5'
          style={{ pathLength, opacity }}
          transition={{ duration: isClicked ? ANIMATION_DURATION : 0 }}
          variants={{
            clicked: { pathLength: 1 },
            unclicked: { pathLength: 0 }
          }}
        />
      </svg>
    </SVGContainer>
  );
};

export default AnimatedCopyIcon;
