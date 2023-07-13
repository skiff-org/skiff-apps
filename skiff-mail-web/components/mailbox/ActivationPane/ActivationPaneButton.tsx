import { motion } from 'framer-motion';
import { Icon, Icons, Size, ThemeMode } from '@skiff-org/skiff-ui';
import React from 'react';
import styled from 'styled-components';

const ButtonContainer = styled(motion.div)`
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-emphasis);
  border: 1px solid var(--border-secondary);
  border-radius: 28px;
  box-shadow: var(--shadow-l2);
  box-sizing: border-box;
  margin-top: 6px;
`;

export interface ActivationPaneButtonProps {
  onClick: (e: React.MouseEvent) => void;
  // If open, the close icon will be displayed in place of the label
  open?: boolean;
}

const ActivationPaneButton: React.FC<ActivationPaneButtonProps> = ({ onClick, open }) => {
  return (
    <ButtonContainer onClick={onClick} whileHover={!open ? { scale: 1.2 } : {}} whileTap={{ scale: 0.8 }}>
      <Icons forceTheme={ThemeMode.DARK} icon={open ? Icon.Close : Icon.Book} size={Size.X_MEDIUM} />
    </ButtonContainer>
  );
};

export default ActivationPaneButton;
