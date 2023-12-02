import { Icon, IconColor, Size } from 'nightwatch-ui';
import React from 'react';
import styled from 'styled-components';

import MailboxCircularProgress from './MailboxCircularProgress';
import { Progress } from './MailboxProgress.types';

export const MAIL_PROGRESS_ITEM_HEIGHT = 74;

const Container = styled.div<{ width: number }>`
  width: ${(props) => props.width}px;
  background: var(--bg-l3-solid);
  border-bottom: 1px solid var(--border-tertiary);
  padding: 16px 20px;
  box-sizing: border-box;
  height: ${MAIL_PROGRESS_ITEM_HEIGHT}px;
`;

const InfoBox = styled.div<{ width: number }>`
  display: flex;
  gap: 12px;
  width: ${(props) => 0.75 * props.width}px;
`;

const Text = styled.div`
  display: flex;
  gap: 2px;
  flex-direction: column;
  width: 100%;
`;

interface MailboxProgressItemProps {
  progress: Progress;
  width: number;
  description: React.ReactNode;
  icon?: Icon;
  iconColor?: IconColor;
  progressColor?: string;
  iconBgColor?: string;
}

const MailboxProgressItem: React.FC<MailboxProgressItemProps> = ({
  width,
  progress,
  description,
  icon,
  iconColor,
  progressColor,
  iconBgColor
}: MailboxProgressItemProps) => {
  return (
    <Container width={width}>
      <InfoBox width={width}>
        <MailboxCircularProgress
          circularProgressSize={Size.LARGE}
          icon={icon}
          iconBgColor={iconBgColor}
          iconColor={iconColor}
          illustrationBgSize={20}
          illustrationIconSize={Size.SMALL}
          progress={progress}
          progressColor={progressColor}
        />
        <Text>{description}</Text>
      </InfoBox>
    </Container>
  );
};

export default MailboxProgressItem;
