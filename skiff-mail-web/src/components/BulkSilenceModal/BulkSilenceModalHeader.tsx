import dayjs from 'dayjs';
import { Icon, Icons, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import pluralize from 'pluralize';
import { DottedGrid } from 'skiff-front-utils';
import { bytesToHumanReadable } from 'skiff-utils';
import styled from 'styled-components';

import useGetSearchIndexProgressDate from '../../hooks/useGetSearchIndexProgressDate';

import { IconContainer, TitleSubtitle } from './BulkSilenceModal.styles';
import BulkSilenceModalStorageBar from './BulkSilenceModalStorageBar';

type BulkSilenceModalRowProps = {
  numSenders: number;
  messageCount: number;
  totalBytes: number;
};

const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: fit-content;
  position: relative;
  background: var(--bg-l1-solid);
  overflow: hidden;
  border-radius: 12px 12px 0 0;
  border-bottom: 1px solid var(--border-tertiary);
`;

const TitleMeter = styled.div`
  display: flex;
  user-select: none;
  flex-direction: column;
  padding: 20px;
  z-index: 1;
  gap: 16px;
`;

const MeterContainer = styled.div`
  display: flex;
  padding: 12px;
  gap: 8px;
  flex-direction: column;
  border-radius: 8px;
  border: 1px solid var(--border-secondary);
  border-bottom-width: 2px;
  background: var(--bg-l2-solid);
`;

const Spacer = styled.div`
  height: 63.3px;
`;

const MeterLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

/**
 * Header for the bulk unsubscribe modal.
 */
const BulkSilenceModalHeader = ({ numSenders, messageCount, totalBytes }: BulkSilenceModalRowProps) => {
  const totalStorage = useGetSearchIndexProgressDate(dayjs(new Date()).subtract(2, 'month').toDate(), new Date());

  return (
    <HeaderSection>
      <DottedGrid hideMotionLine left={200} top={-240} />
      <TitleMeter>
        <IconContainer>
          <Icons color='link' icon={Icon.Envelope} size={20} />
        </IconContainer>
        <TitleSubtitle>
          <Typography size={TypographySize.H4} weight={TypographyWeight.MEDIUM}>
            Clear out the noise
          </Typography>
          <Typography color='secondary'>
            {`We found ${pluralize('sender', numSenders, true)}
             you might want to clear from your inbox. Silence senders to remove them from your inbox forever.`}
          </Typography>
        </TitleSubtitle>
        {!!totalStorage && (
          <MeterContainer>
            <MeterLabel>
              <Typography color='secondary' mono size={TypographySize.CAPTION} uppercase>
                Inbox Noise meter
              </Typography>
              <Typography color='disabled' mono size={TypographySize.CAPTION} uppercase>
                {`${messageCount} NOISY EMAILS • ${bytesToHumanReadable(totalBytes)}`}
              </Typography>
            </MeterLabel>
            <BulkSilenceModalStorageBar totalStorage={totalStorage} usedStorage={messageCount} />
          </MeterContainer>
        )}
        {!totalStorage && <Spacer />}
      </TitleMeter>
    </HeaderSection>
  );
};

export default BulkSilenceModalHeader;
