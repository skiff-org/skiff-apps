import { Icon, IconText, Type, Typography, TypographyWeight } from 'nightwatch-ui';
import pluralize from 'pluralize';
import { useState } from 'react';
import { useGetSilencedSendersQuery } from 'skiff-front-graphql';
import { TitleActionSection } from 'skiff-front-utils';
import styled from 'styled-components';

import { getTotalEmailsAndSenders } from '../../../utils/silencingUtils';
import { transformArrayToRecord } from '../../BulkSilenceModal/BulkSilenceModal.constants';
import { BulkSilenceData, UnsubscribeKey } from '../../BulkSilenceModal/BulkSilenceModal.types';
import BulkSilenceModalSenderTable from '../../BulkSilenceModal/BulkSilenceModalSenderTable';

const ReviewTable = styled.div<{ $clickable?: boolean }>`
  width: 100%;
  display: flex;
  gap: 20px;
  flex-direction: column;
  padding: 12px;
  box-sizing: border-box;
  background: var(--bg-overlay-quaternary);
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  ${(props) =>
    props.$clickable &&
    `
    cursor: pointer;
    :hover {
      background: var(--bg-overlay-tertiary);
    }
  `}
`;

const TitleExpand = styled.div`
  width: 100%;
  justify-content: space-between;
  align-items: center;
  display: flex;
`;

const OrangeText = styled.span`
  color: var(--text-link);
`;

export const ReviewSilenceSetting = () => {
  const [tableExpanded, setTableExpanded] = useState(false);
  const { data: silencedSenderData } = useGetSilencedSendersQuery();
  const { silenceSenderDomains, silenceSenderIndividuals } = silencedSenderData?.silencedSenders || {
    silenceSenderDomains: [],
    silenceSenderIndividuals: []
  };

  const transformedSilencedSenderDomains = !!silenceSenderDomains
    ? transformArrayToRecord(silenceSenderDomains, UnsubscribeKey.Domain)
    : undefined;
  const transformedSilencedSenderIndividuals = !!silenceSenderIndividuals
    ? transformArrayToRecord(silenceSenderIndividuals, UnsubscribeKey.Sender)
    : undefined;

  const bulkSilenceData: BulkSilenceData =
    transformedSilencedSenderDomains || transformedSilencedSenderIndividuals
      ? { ...(transformedSilencedSenderDomains ?? {}), ...(transformedSilencedSenderIndividuals ?? {}) }
      : {};

  const { totalSenders } = getTotalEmailsAndSenders(silenceSenderDomains, silenceSenderIndividuals);

  const toggleExpand = () => setTableExpanded(!tableExpanded);
  return (
    <>
      <TitleActionSection subtitle='Review senders you have silenced so far.' title='Already silenced senders' />
      <ReviewTable $clickable={!tableExpanded} onClick={tableExpanded ? undefined : toggleExpand}>
        <TitleExpand>
          <Typography color={Type.SECONDARY} selectable={false} weight={TypographyWeight.MEDIUM}>
            <OrangeText>{totalSenders}</OrangeText> Silenced {`${pluralize('sender', totalSenders)}`}
          </Typography>
          <IconText onClick={toggleExpand} startIcon={tableExpanded ? Icon.ChevronUp : Icon.ChevronRight} />
        </TitleExpand>
        {tableExpanded && <BulkSilenceModalSenderTable noContainer sections={[{ bulkSilenceData }]} />}
      </ReviewTable>
    </>
  );
};
