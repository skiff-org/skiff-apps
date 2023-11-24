import pluralize from 'pluralize';
import { useDispatch } from 'react-redux';
import { useGetSilenceSenderSuggestionsQuery } from 'skiff-front-graphql';
import { TitleActionSection } from 'skiff-front-utils';

import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { getTotalEmailsAndSenders } from '../../../utils/silencingUtils';

export const SuggestSilenceSetting = () => {
  const dispatch = useDispatch();
  const openUnsubscribeModal = () =>
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.BulkUnsubscribe }));

  const { data: silenceSenderSuggestionsData } = useGetSilenceSenderSuggestionsQuery();

  const { silenceSenderDomains, silenceSenderIndividuals } = silenceSenderSuggestionsData?.silenceSenderSuggestions || {
    silenceSenderDomains: [],
    silenceSenderIndividuals: []
  };
  const { totalSenders } = getTotalEmailsAndSenders(silenceSenderDomains, silenceSenderIndividuals);

  return (
    <TitleActionSection
      actions={[
        {
          onClick: () => {
            openUnsubscribeModal();
          },
          label: 'Review',
          type: 'button'
        }
      ]}
      subtitle={
        totalSenders > 0
          ? 'We’ve identified more senders you may want to silence.'
          : "You've cleared your inbox of noisy senders."
      }
      title={`${pluralize('new sender', totalSenders, true)} to review`}
    />
  );
};
