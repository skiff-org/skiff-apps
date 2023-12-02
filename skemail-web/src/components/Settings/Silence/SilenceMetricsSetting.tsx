import { Typography, TypographySize } from 'nightwatch-ui';
import pluralize from 'pluralize';
import { useGetSilencedSendersQuery } from 'skiff-front-graphql';
import { TitleActionSection } from 'skiff-front-utils';
import { bytesToHumanReadable } from 'skiff-utils';
import styled from 'styled-components';

import { getTotalEmailsAndSenders } from '../../../utils/silencingUtils';

const MetricBox = styled.div`
  background: var(--bg-overlay-quaternary);
  border: 1px solid var(--border-secondary);
  border-radius: 4px;
  padding: 8px;
  box-sizing: border-box;
  display: flex;
  width: 100%;
  align-items: center;
`;

const Metrics = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

const MetricData = styled.div`
  display: flex;
  flex-direction: column;
`;

export const SilenceMetricsSetting = () => {
  const { data: silencedSenderData } = useGetSilencedSendersQuery();
  const { silenceSenderDomains, silenceSenderIndividuals } = silencedSenderData?.silencedSenders || {
    silenceSenderDomains: [],
    silenceSenderIndividuals: []
  };

  const { totalSenders, totalEmails, totalBytes } = getTotalEmailsAndSenders(
    silenceSenderDomains,
    silenceSenderIndividuals
  );

  const constructTweetText = () => {
    const formattedBytes = bytesToHumanReadable(totalBytes);
    return `I've protected my inbox from ${totalEmails} useless emails, ${totalSenders} annoying senders, and ${formattedBytes} of wasted storage by turning on noise canceling from @skiffprivacy \n\n Free your inbox on Skiff https://skiff.com/email-unsubscribe.`;
  };

  const openTwitterShare = () => {
    const tweetLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(constructTweetText())}`;
    window.open(tweetLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <TitleActionSection
        actions={[
          {
            onClick: () => {
              openTwitterShare();
            },
            label: 'Share',
            type: 'button'
          }
        ]}
        subtitle="See how much hassle you've saved by silencing senders."
        title='Inbox statistics'
      />
      <Metrics>
        <MetricBox>
          <MetricData>
            <Typography color='link' selectable={false} size={TypographySize.LARGE}>
              {totalEmails}
            </Typography>
            <Typography color='disabled' mono selectable={false} size={TypographySize.SMALL} uppercase>
              {pluralize('EMAIL', totalEmails)} SILENCED
            </Typography>
          </MetricData>
        </MetricBox>
        <MetricBox>
          <MetricData>
            <Typography color='link' selectable={false} size={TypographySize.LARGE}>
              {totalSenders}
            </Typography>
            <Typography color='disabled' mono selectable={false} size={TypographySize.SMALL} uppercase>
              NOISY {pluralize('SENDERS', totalEmails)} BLOCKED
            </Typography>
          </MetricData>
        </MetricBox>
        <MetricBox>
          <MetricData>
            <Typography color='link' selectable={false} size={TypographySize.LARGE}>
              {bytesToHumanReadable(totalBytes)}
            </Typography>
            <Typography color='disabled' mono selectable={false} size={TypographySize.SMALL} uppercase>
              STORAGE SAVED
            </Typography>
          </MetricData>
        </MetricBox>
      </Metrics>
    </>
  );
};
