import { motion } from 'framer-motion';
import React from 'react';
import { isMobile } from 'react-device-detect';

export const DesktopMotionDiv = React.forwardRef<HTMLDivElement, any>(function DesktopMotionDiv(
  { children, ...rest },
  ref
) {
  if (isMobile) {
    return (
      <div {...rest} ref={ref}>
        {children}
      </div>
    );
  }
  return (
    <motion.div {...rest} ref={ref}>
      {children}
    </motion.div>
  );
});
