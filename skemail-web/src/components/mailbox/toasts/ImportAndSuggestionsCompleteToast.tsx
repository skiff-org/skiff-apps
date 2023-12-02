import { FilledVariant, IconText, ThemeMode, TypographyWeight } from 'nightwatch-ui';
import { SnackbarKey } from 'notistack';
import React, { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { GetSilenceSenderSuggestionsDocument, useGetSilenceSenderSuggestionsQuery } from 'skiff-front-graphql';
import { useLocalSetting, useToast } from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import client from '../../../apollo/client';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { getTotalEmailsAndSenders } from '../../../utils/silencingUtils';
import { NoisyEmailsMeter } from '../../NoisyEmailsMeter';

const NoisyEmailsMeterContainer = styled.div<{ $padBottom: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  gap: 16px;
  ${({ $padBottom }) => $padBottom && 'padding-bottom: 8px;'}
`;

export const ImportAndSuggestionsCompleteToast: React.FC = () => {
  const dispatch = useDispatch();
  const { enqueueToast, closeToast } = useToast();

  const [, setHideImportComplete] = useLocalSetting(StorageTypes.HIDE_IMPORT_COMPLETE);

  const { data: silenceSenderSuggestionsData, loading } = useGetSilenceSenderSuggestionsQuery({
    fetchPolicy: 'no-cache', // get the most up to date suggestions
    onCompleted: (result) => {
      client.cache.updateQuery({ query: GetSilenceSenderSuggestionsDocument }, () => result);
    }
  });
  const { silenceSenderDomains, silenceSenderIndividuals } = silenceSenderSuggestionsData?.silenceSenderSuggestions || {
    silenceSenderDomains: [],
    silenceSenderIndividuals: []
  };
  const { totalEmails: totalNoisyEmails } = getTotalEmailsAndSenders(silenceSenderDomains, silenceSenderIndividuals);

  const openUnsubscribeModal = useCallback(() => {
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.BulkUnsubscribe }));
  }, [dispatch]);

  useEffect(() => {
    if (loading) return;

    const hasNoisySenderSuggestions = !!totalNoisyEmails;

    let key: SnackbarKey | undefined = undefined;
    key = enqueueToast({
      title: 'Import complete',
      body: totalNoisyEmails
        ? 'Clear distractions by silencing noisy senders from your inbox.'
        : 'Your imported emails are clear of all noisy senders!',
      persist: hasNoisySenderSuggestions, // only persist the toast if there noisy sender suggestions
      content: hasNoisySenderSuggestions ? (
        <NoisyEmailsMeterContainer $padBottom={!totalNoisyEmails}>
          <NoisyEmailsMeter forceTheme={ThemeMode.DARK} numNoisyEmails={totalNoisyEmails} />
          <IconText
            forceTheme={ThemeMode.DARK}
            fullWidth
            label='Free space'
            onClick={() => {
              openUnsubscribeModal();
              closeToast(key);
            }}
            variant={FilledVariant.FILLED}
            weight={TypographyWeight.REGULAR}
          />
        </NoisyEmailsMeterContainer>
      ) : undefined
    });
    setHideImportComplete(true);
  }, [closeToast, dispatch, enqueueToast, loading, openUnsubscribeModal, setHideImportComplete, totalNoisyEmails]);

  return null;
};
