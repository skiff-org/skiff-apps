import React, { useEffect } from 'react';
import styled from 'styled-components';

import AnimatedCopyIcon from './AnimatedCopyIcon';

interface CopyToClipboardButtonProps {
  onClick: (evt?: React.MouseEvent) => void;
  className?: string;
}

export const COPIED_DURATION = 2500;

const ButtonContainer = styled.button`
  padding-left: 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  outline: none;
  svg {
    width: 24px;
    height: 24px;
  }
`;

const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({ onClick, className }) => {
  const [isClicked, setIsClicked] = React.useState(false);

  useEffect(() => {
    if (isClicked) {
      const timer = setTimeout(() => {
        setIsClicked(false);
      }, COPIED_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isClicked]);

  return (
    <ButtonContainer
      aria-label='Copy to clipboard'
      className={className}
      disabled={isClicked}
      onClick={() => {
        onClick();
        setIsClicked(true);
      }}
      title='Copy to clipboard'
    >
      <AnimatedCopyIcon isClicked={isClicked} />
    </ButtonContainer>
  );
};

export default CopyToClipboardButton;
