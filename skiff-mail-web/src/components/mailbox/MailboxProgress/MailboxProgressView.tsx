import { Size, MonoTag } from 'nightwatch-ui';
import pluralize from 'pluralize';
import React from 'react';
import { EmptyMailbox, MailTypography } from 'skiff-front-utils';
import styled from 'styled-components';

import MailboxCircularProgress from './MailboxCircularProgress';
import { Progress } from './MailboxProgress.types';

const LogoLoader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  width: 296px;
`;

const InfoBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
`;

const ProgressTag = styled(MonoTag)`
  font-variant-numeric: tabular-nums;
`;

interface MailboxProgressViewProps {
  description: React.ReactNode;
  progress?: Progress;
  actionLabel?: string;
}

/**
 * Mailbox view used for rendering the search index and import progress
 */
const MailboxProgressView: React.FC<MailboxProgressViewProps> = ({
  progress,
  actionLabel,
  description
}: MailboxProgressViewProps) => {
  return (
    <EmptyMailbox>
      <LogoLoader>
        <MailboxCircularProgress
          circularProgressSize={Size.X_LARGE}
          illustrationIconSize={Size.X_MEDIUM}
          progress={progress}
        />
        <InfoBox>
          <MailTypography>{description}</MailTypography>
          {actionLabel && progress && (
            <ProgressTag
              bgColor='var(--bg-overlay-tertiary)'
              // we're calling these emails even though if they are threads to keep things colloquial;
              // ie for the search index, the progress is given in terms of threads, but
              // the proportion is more important than unit or absolute number
              label={`${progress.numProcessed.toLocaleString()} ${
                progress.numToProcess ? `/ ${progress.numToProcess.toLocaleString()}` : ''
              } ${pluralize('email', progress.numToProcess)} ${actionLabel}`}
              textColor='disabled'
            />
          )}
        </InfoBox>
      </LogoLoader>
    </EmptyMailbox>
  );
};

export default MailboxProgressView;
