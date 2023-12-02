import { CircularProgress, Size, CircularProgressSize, PROGRESS_SIZE, Icon, Icons, IconColor } from 'nightwatch-ui';
import React from 'react';
import styled from 'styled-components';

import { Progress } from './MailboxProgress.types';

const CircularProgressContainer = styled.div<{ size: number }>`
  position: relative;
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;
`;

const IllustrationOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const IllustrationContainer = styled.div<{ $color: string; $size: number }>`
  display: flex;
  align-items: center;
  justify-content: center;

  background: ${(props) => props.$color};
  box-shadow: var(--secondary-button-border);
  border-radius: 30%;

  height: ${(props) => props.$size}px;
  width: ${(props) => props.$size}px;

  cursor: pointer;
`;

interface MailboxCircularProgressProps {
  circularProgressSize: CircularProgressSize;
  progress?: Progress;
  illustrationBgSize?: number;
  illustrationIconSize?: Size;
  icon?: Icon;
  iconColor?: IconColor;
  progressColor?: string;
  iconBgColor?: string;
}

const MailboxCircularProgress: React.FC<MailboxCircularProgressProps> = ({
  circularProgressSize,
  progress,
  illustrationBgSize = 40,
  illustrationIconSize,
  icon,
  iconColor,
  progressColor,
  iconBgColor
}: MailboxCircularProgressProps) => {
  const isComplete = !!progress?.numToProcess && progress.numProcessed / progress.numToProcess === 1;
  return (
    <CircularProgressContainer size={PROGRESS_SIZE[circularProgressSize]}>
      <IllustrationOverlay>
        <IllustrationContainer $color={iconBgColor ?? 'var(--bg-overlay-primary)'} $size={illustrationBgSize}>
          <Icons
            color={iconColor ?? 'disabled'}
            icon={icon ?? (isComplete ? Icon.Check : Icon.EnvelopeFilled)}
            size={illustrationIconSize}
          />
        </IllustrationContainer>
      </IllustrationOverlay>
      <CircularProgress
        progress={progress?.numToProcess ? (progress.numProcessed / progress.numToProcess) * 100 : undefined}
        progressColor={progressColor ?? 'var(--border-primary)'}
        size={circularProgressSize}
        spinner={!progress?.numToProcess} // If we do not have the total number to process, render an infinite spinner
      />
    </CircularProgressContainer>
  );
};
export default MailboxCircularProgress;
