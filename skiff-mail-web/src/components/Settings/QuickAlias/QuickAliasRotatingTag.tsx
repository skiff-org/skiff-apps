import { motion } from 'framer-motion';
import { Typography, TypographyProps } from 'nightwatch-ui';
import { useEffect, useState } from 'react';

import { EXAMPLE_TAGS } from './QuickAliasList/QuickAlias.constants';

const smoothTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 1
};

const slideUpFadeVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 }
};

export default function QuickAliasRotatingTag(props: TypographyProps) {
  const [tag, setTag] = useState(EXAMPLE_TAGS[0]);
  useEffect(() => {
    const interval = setInterval(() => {
      const index = EXAMPLE_TAGS.indexOf(tag || '');
      setTag(EXAMPLE_TAGS[(index + 1) % EXAMPLE_TAGS.length]);
    }, 2000);
    return () => clearInterval(interval);
  }, [tag]);

  return (
    <motion.div
      animate='visible'
      exit='exit'
      initial='hidden'
      key={tag}
      transition={smoothTransition}
      variants={slideUpFadeVariants}
    >
      <Typography {...props}>{tag}</Typography>
    </motion.div>
  );
}
