import { motion } from 'framer-motion';
import styled from 'styled-components';

import { INTER_MASK_GAP } from './constants';

export const BackgroundActiveMask = styled(motion.div)<{ rowHeight: number }>`
  background: rgba(255, 255, 255, 0.12);
  height: ${(props) => props.rowHeight - INTER_MASK_GAP}px;
  border-radius: 8px;
  width: 100%;
  position: absolute;
  margin: 0 auto;
`;

export const BackgroundHoverMask = styled(motion.div)<{ rowHeight: number }>`
  background: rgba(255, 255, 255, 0.08);
  height: ${(props) => props.rowHeight - INTER_MASK_GAP}px;
  border-radius: 8px;
  width: 100%;
  position: absolute;
  margin: 0 auto;
`;
