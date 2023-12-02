import {
  ButtonGroup,
  ButtonGroupItem,
  Dialog,
  Icon,
  Icons,
  Size,
  Toggle,
  Typography,
  TypographyProps,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import pluralize from 'pluralize';
import React, { useState } from 'react';
import {
  GetSilenceSenderSuggestionsDocument,
  GetSilencedSendersDocument,
  GetThreadFromIdDocument,
  useBulkTrashMutation,
  useSilenceMultipleEmailAddressesMutation
} from 'skiff-front-graphql';
import { DEFAULT_WORKSPACE_EVENT_VERSION, DottedGrid, useLocalSetting, useToast } from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import { useThreadActions } from '../../../hooks/useThreadActions';
import { storeWorkspaceEvent } from '../../../utils/userUtils';

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 9;
  position: relative;
`;

const StyledDottedGrid = styled(DottedGrid)`
  top: 0px;
  width: 100%;
  height: 120px;
  opacity: 60%;
  border-radius: 12px;
`;

const Title = styled.div`
  display: flex;
  gap: 4px;
`;

const ToggleContainer = styled.div`
  display: flex;
  padding: 16px;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  align-self: stretch;
  border-radius: 8px;
  border: 1px solid var(--border-secondary);
  background: var(--bg-overlay-quaternary);
`;

const IconContainer = styled.div`
  width: 36px;
  height: 36px;
  fill: var(--bg-l3-solid);
  border: 1px solid var(--border-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
`;

const IconAccent = styled.svg`
  position: absolute;
`;

interface ConfirmSilencingModalProps {
  addressesToSilence: string[];
  open: boolean;
  onClose: (isSenderSilenced?: boolean) => void;
  // number of suggested senders for workspace event
  numSuggested?: number;
}

export const ConfirmSilencingModal: React.FC<ConfirmSilencingModalProps> = ({
  addressesToSilence,
  open,
  onClose,
  numSuggested
}: ConfirmSilencingModalProps) => {
  const [silenceEmailAddresses, { loading }] = useSilenceMultipleEmailAddressesMutation();
  const [bulkSilence] = useBulkTrashMutation();
  const [showSilenceFooterThreshold, setShowSilenceFooterThreshold] = useLocalSetting(
    StorageTypes.SHOW_SILENCE_FOOTER_THRESHOLD
  );

  const { activeThreadID } = useThreadActions();

  const { enqueueToast } = useToast();
  const [trashAllPastEmails, setTrashAllPastEmails] = useState(true);
  const numToSilence = addressesToSilence.length;

  const titleTypographyProps: Pick<TypographyProps, 'size' | 'weight'> = {
    size: TypographySize.H4,
    weight: TypographyWeight.MEDIUM
  };

  const confirmSilence = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const refetchQueriesList: any[] = [
        { query: GetSilenceSenderSuggestionsDocument },
        { query: GetSilencedSendersDocument }
      ];

      if (activeThreadID) {
        refetchQueriesList.push({ query: GetThreadFromIdDocument, variables: { threadID: activeThreadID } });
      }

      await silenceEmailAddresses({
        variables: {
          request: {
            emailAddressesToSilence: addressesToSilence
          }
        },
        refetchQueries: refetchQueriesList
      });
      if (!!showSilenceFooterThreshold) {
        setShowSilenceFooterThreshold(-1);
      }
      void storeWorkspaceEvent(
        WorkspaceEventType.MarkSilence,
        JSON.stringify({
          numSilence: addressesToSilence.length,
          numSuggested
        }),
        DEFAULT_WORKSPACE_EVENT_VERSION
      );
      enqueueToast({
        title: 'Sender silenced',
        body: `You will no longer receive emails from ${
          numToSilence === 1 && addressesToSilence[0] ? addressesToSilence[0] : 'these senders'
        }.`
      });
      onClose(true);

      if (trashAllPastEmails) {
        // Loop through addressesToSilence and call bulkSilence for each one
        const silencePromises = addressesToSilence.map((sender) =>
          bulkSilence({
            variables: {
              request: {
                sender: sender
              }
            },
            refetchQueries: [{ query: GetSilenceSenderSuggestionsDocument }]
          })
        );
        await Promise.all(silencePromises);
      }
    } catch (e) {
      console.error(e);
      enqueueToast({
        title: 'Could not silence sender',
        body: 'Please try again later.'
      });
      onClose(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <Dialog customContent hideCloseButton onClose={onClose} open={open}>
      <div>
        <Header>
          <IconContainer>
            <Icons color='link' icon={Icon.EnvelopeSilence} size={Size.X_MEDIUM} />
            <IconAccent height='13' width='18'>
              <path
                d='M13.5 3L9 6L4.01139e-05 0.10791L0 7.5V13H17.8463V2.5L13.5 3Z'
                fill='var(--icon-link)'
                fillOpacity='0.36'
              />
            </IconAccent>
          </IconContainer>
          <Title>
            <Typography {...titleTypographyProps}>{numToSilence === 1 ? 'Silence this sender?' : 'Silence'}</Typography>
            {numToSilence > 1 && (
              <Typography {...titleTypographyProps} color='link'>
                {pluralize('noisy sender', numToSilence, true)}
              </Typography>
            )}
          </Title>
          <Typography color='secondary' wrap>
            No future emails from&nbsp;
            {numToSilence === 1 && addressesToSilence[0] ? addressesToSilence[0] : 'these senders'} will ever reach your
            inbox.
          </Typography>
        </Header>
        <StyledDottedGrid hideMotionLine />
      </div>
      <ToggleContainer>
        <Typography color='secondary'>
          Move all past emails from {numToSilence === 1 && addressesToSilence[0] ? 'this sender' : 'these senders'} to
          trash
        </Typography>
        <Toggle
          checked={trashAllPastEmails}
          onChange={() => {
            setTrashAllPastEmails((prev) => !prev);
          }}
          size={Size.MEDIUM}
        />
      </ToggleContainer>
      <ButtonGroup>
        <ButtonGroupItem key='Confirm' label='Confirm' loading={loading} onClick={confirmSilence} />
        <ButtonGroupItem key='back' label='Back' onClick={() => onClose()} />
      </ButtonGroup>
    </Dialog>
  );
};
