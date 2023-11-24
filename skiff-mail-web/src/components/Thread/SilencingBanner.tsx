import { FilledVariant, Icon, IconText, Size, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import pluralize from 'pluralize';
import { useState } from 'react';
import styled from 'styled-components';

import {
  ConfirmUpdateNotificationsForSenderModal,
  ConfirmSilencingModal,
  NotificationsForSenderState
} from '../shared/Silencing';
import { ConfirmNotNoiseModal } from '../shared/Silencing/ConfirmNotNoiseModal';

const BannerContainer = styled.div`
  display: flex;
  padding: 12px;
  justify-content: space-between;
  border-radius: 8px;
  background: var(--bg-overlay-quaternary);
  border: 1px solid var(--border-tertiary);
  margin: 12px 16px;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CTAContainer = styled.div`
  display: flex;
  gap: 4px;
`;

const CloseBtn = styled(IconText)`
  position: relative;
  align-items: flex-start;
  height: fit-content;

  // To account for the "hidden" padding that only is shown on hover on the icon
  top: -4px;
  right: -4px;
`;

interface SilencingBannerProps {
  numMessages: number;
  senderAlias: string;
  onClose: () => void;
  threadID: string;
  silenceLabel?: string;
}

export const SilencingBanner: React.FC<SilencingBannerProps> = ({
  numMessages,
  senderAlias,
  onClose,
  threadID,
  silenceLabel
}: SilencingBannerProps) => {
  const [confirmNotNoiseModalOpen, setConfirmNotNoiseModalOpen] = useState(false);
  const [confirmSilencingModalOpen, setConfirmSilencingModalOpen] = useState(false);
  const [confirmHideNotificationsOpen, setConfirmHideNotificationsOpen] = useState(false);

  return (
    <>
      <BannerContainer>
        <Content>
          <Typography color='secondary' size={TypographySize.SMALL} wrap>
            You&rsquo;ve received {pluralize('message', numMessages, true)} from {senderAlias} in the past month
          </Typography>
          <CTAContainer>
            <IconText
              color='secondary'
              label='Allow'
              onClick={() => {
                setConfirmNotNoiseModalOpen(true);
              }}
              size={Size.SMALL}
              variant={FilledVariant.FILLED}
              weight={TypographyWeight.REGULAR}
            />
            <IconText
              color='destructive'
              label={silenceLabel ?? 'Silence sender'}
              onClick={() => {
                setConfirmSilencingModalOpen(true);
              }}
              size={Size.SMALL}
              variant={FilledVariant.FILLED}
              weight={TypographyWeight.REGULAR}
            />
            <IconText
              color='secondary'
              label='Turn off notifications'
              onClick={() => {
                setConfirmHideNotificationsOpen(true);
              }}
              size={Size.SMALL}
              variant={FilledVariant.UNFILLED}
              weight={TypographyWeight.REGULAR}
            />
          </CTAContainer>
        </Content>
        <CloseBtn color='secondary' onClick={onClose} size={Size.SMALL} startIcon={Icon.Close} />
      </BannerContainer>
      <ConfirmNotNoiseModal
        closeBanner={onClose}
        confirmNotNoiseOpen={confirmNotNoiseModalOpen}
        emailAddress={senderAlias}
        isMarkNotNoise
        setConfirmNotNoiseOpen={setConfirmNotNoiseModalOpen}
      />
      <ConfirmSilencingModal
        addressesToSilence={[senderAlias]}
        onClose={(isSenderSilenced?: boolean) => {
          setConfirmSilencingModalOpen(false);
          // Close the banner if the sender was silenced
          if (isSenderSilenced) onClose();
        }}
        open={confirmSilencingModalOpen}
      />
      <ConfirmUpdateNotificationsForSenderModal
        closeBanner={onClose}
        confirmHideNotificationsOpen={confirmHideNotificationsOpen}
        emailAddresses={[senderAlias]}
        setConfirmHideNotificationsOpen={setConfirmHideNotificationsOpen}
        state={NotificationsForSenderState.OFF}
        threadID={threadID}
      />
    </>
  );
};
