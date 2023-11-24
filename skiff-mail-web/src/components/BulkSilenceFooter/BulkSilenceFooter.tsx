import dayjs from 'dayjs';
import { FilledVariant, IconText, TypographyWeight } from 'nightwatch-ui';
import { useDispatch } from 'react-redux';
import { useGetSilenceSenderSuggestionsQuery } from 'skiff-front-graphql';
import { DEFAULT_WORKSPACE_EVENT_VERSION, MONTH_UNIT, useLocalSetting } from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import { useEffect } from 'react';
import useGetSearchIndexProgressDate from '../../hooks/useGetSearchIndexProgressDate';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { getTotalEmailsAndSenders } from '../../utils/silencingUtils';
import { storeWorkspaceEvent } from '../../utils/userUtils';
import { NoisyEmailsMeter } from '../NoisyEmailsMeter';

const FooterContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  gap: 8px;
`;

const DISPLAY_THRESHOLD = 5; // TODO: this can be based on percent total emails
const SHOW_AGAIN_THRESHOLD = 100; // number of new emails until footer appears again

interface BulkSilenceFooterProps {
  setSilenceFooterOpen: (open: boolean) => void;
}

/**
 * Footer for prompting users to bulk silence
 */
const BulkSilenceFooter = ({ setSilenceFooterOpen }: BulkSilenceFooterProps) => {
  const dispatch = useDispatch();

  const [showSilenceFooterThreshold, setShowSilenceFooterThreshold] = useLocalSetting(
    StorageTypes.SHOW_SILENCE_FOOTER_THRESHOLD
  );
  const numTotalEmails = useGetSearchIndexProgressDate(dayjs(new Date()).subtract(2, MONTH_UNIT).toDate(), new Date());

  const { data: silenceSenderSuggestionsData } = useGetSilenceSenderSuggestionsQuery();

  const { silenceSenderDomains, silenceSenderIndividuals } = silenceSenderSuggestionsData?.silenceSenderSuggestions || {
    silenceSenderDomains: [],
    silenceSenderIndividuals: []
  };

  // TODO: should be a separate query
  const { totalEmails: totalNoisyEmails } = getTotalEmailsAndSenders(silenceSenderDomains, silenceSenderIndividuals);

  const dismissFooter = () => {
    setShowSilenceFooterThreshold(totalNoisyEmails + SHOW_AGAIN_THRESHOLD);
    void storeWorkspaceEvent(WorkspaceEventType.CloseNoiseCancelFooter, '', DEFAULT_WORKSPACE_EVENT_VERSION);
  };
  // if a user closes the footer, we don't want to show it again until totalEmails surpasses threshold
  const hideDismissed = showSilenceFooterThreshold > 0 && totalNoisyEmails < showSilenceFooterThreshold;
  const showFooter = totalNoisyEmails > DISPLAY_THRESHOLD;

  const openUnsubscribeModal = () => {
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.BulkUnsubscribe }));
    void storeWorkspaceEvent(WorkspaceEventType.OpenNoiseCancelFooter, '', DEFAULT_WORKSPACE_EVENT_VERSION);
  };

  const closed = hideDismissed || !showFooter || !numTotalEmails;

  useEffect(() => {
    if (closed) {
      setSilenceFooterOpen(false);
    } else {
      setSilenceFooterOpen(true);
    }
    return () => {
      setSilenceFooterOpen(false);
    };
  }, [closed, setSilenceFooterOpen]);

  if (closed) return null;

  return (
    <FooterContainer>
      <NoisyEmailsMeter dismiss={dismissFooter} numNoisyEmails={totalNoisyEmails} numTotalEmails={numTotalEmails} />
      <IconText
        fullWidth
        label='Free space'
        onClick={openUnsubscribeModal}
        variant={FilledVariant.FILLED}
        weight={TypographyWeight.REGULAR}
      />
    </FooterContainer>
  );
};

export default BulkSilenceFooter;
