import { motion, SVGMotionProps } from 'framer-motion';
import React from 'react';
import styled from 'styled-components';

interface AnimatedCopyIconProps {
  isOpen: boolean;
}

const Path = (
  props: JSX.IntrinsicAttributes & SVGMotionProps<SVGPathElement> & React.RefAttributes<SVGPathElement>
) => <motion.path fill='transparent' stroke='hsl(0, 0%, 18%)' strokeLinecap='round' strokeWidth='3' {...props} />;

const IconContainer = styled.div`
  z-index: 1;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
`;

const AnimatedArrowIcon: React.FC<AnimatedCopyIconProps> = ({ isOpen }) => {
  return (
    <IconContainer>
      <svg fill='none' height='24px' viewBox='0 0 24 24' width='24px' xmlns='https://www.w3.org/2000/svg'>
        <Path
          animate={isOpen ? 'open' : 'closed'}
          stroke='#979797'
          strokeLinecap='square'
          strokeLinejoin='miter'
          strokeWidth='1.5'
          variants={{
            closed: { d: 'M8 4L16 12L8 20' },
            open: { d: 'M13.5 5.5L20 12L13.5 18.5' }
          }}
        />
        <Path
          animate={isOpen ? 'open' : 'closed'}
          d='M20 12L3 12'
          stroke='#979797'
          strokeLinecap='round'
          strokeWidth='1.5'
          transition={{ duration: 0.1 }}
          variants={{
            closed: { opacity: 0 },
            open: { opacity: 1 }
          }}
        />
      </svg>
    </IconContainer>
  );
};

export default AnimatedArrowIcon;
