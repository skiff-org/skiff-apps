import { Dialog, Size } from 'nightwatch-ui';
import { useEffect, useState } from 'react';
import { useGetSilenceSenderSuggestionsQuery } from 'skiff-front-graphql';
import isEmail from 'validator/lib/isEmail';

import { getTotalEmailsAndSenders } from '../../utils/silencingUtils';
import { ConfirmSilencingModal } from '../shared/Silencing';

import { transformArrayToRecord } from './BulkSilenceModal.constants';
import { UnsubscribeKey } from './BulkSilenceModal.types';
import BulkSilenceModalFooter from './BulkSilenceModalFooter';
import BulkSilenceModalHeader from './BulkSilenceModalHeader';
import BulkSilenceModalSenderTable from './BulkSilenceModalSenderTable';

interface BulkUnsubscribeModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal component for viewing and sorting mailing lists and
 * bothersome senders. Allows users to unsubscribe in bulk with one-click.
 */
const BulkSilenceModal = (props: BulkUnsubscribeModalProps) => {
  const { open, onClose } = props;

  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
  const { data: silenceSenderSuggestionsData, loading: loadingSuggestions } = useGetSilenceSenderSuggestionsQuery();

  const { silenceSenderDomains, silenceSenderIndividuals } = silenceSenderSuggestionsData?.silenceSenderSuggestions || {
    silenceSenderDomains: [],
    silenceSenderIndividuals: []
  };

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean> | null>(null);
  useEffect(() => {
    if (checkedItems !== null) return;
    const initialCheckedState = {
      ...Object.fromEntries(silenceSenderDomains.map((suggestion) => [suggestion.domain, true])),
      ...Object.fromEntries(
        silenceSenderDomains.flatMap((suggestion) => suggestion.senders.map((sender) => [sender.sender, true]))
      ),
      ...Object.fromEntries(silenceSenderIndividuals.map((individual) => [individual.sender, true]))
    };
    setCheckedItems(initialCheckedState);
  }, [silenceSenderDomains, silenceSenderIndividuals]);

  const checkedEmailsToBlock = !!checkedItems
    ? Object.keys(checkedItems).filter((key) => checkedItems[key] === true && isEmail(key))
    : [];
  const onOpenBlockConfirm = () => {
    setConfirmBlockOpen(true);
  };

  const onCloseConfirmBlockModal = () => {
    setConfirmBlockOpen(false);
  };

  const { totalEmails, totalSenders, totalBytes } = getTotalEmailsAndSenders(
    silenceSenderDomains,
    silenceSenderIndividuals
  );

  const transformedSilenceSenderSuggestions = !!silenceSenderDomains
    ? transformArrayToRecord(silenceSenderDomains, UnsubscribeKey.Domain)
    : undefined;
  const transformedSilenceSenderIndividuals = !!silenceSenderIndividuals
    ? transformArrayToRecord(silenceSenderIndividuals, UnsubscribeKey.Sender)
    : undefined;

  if (!open) return null;

  return (
    <Dialog customContent hideCloseButton noPadding onClose={onClose} open={open} size={Size.X_LARGE}>
      <BulkSilenceModalHeader messageCount={totalEmails} numSenders={totalSenders} totalBytes={totalBytes} />
      <BulkSilenceModalSenderTable
        checkedItems={checkedItems || {}}
        loadingSuggestions={loadingSuggestions}
        sections={[
          {
            sectionLabel: 'Marketers that won’t leave you alone',
            emptyText: 'No marketers to silence',
            bulkSilenceData: transformedSilenceSenderSuggestions
          },
          {
            sectionLabel: 'Senders always left unreplied',
            emptyText: 'No senders to silence',
            bulkSilenceData: transformedSilenceSenderIndividuals,
            hide: !silenceSenderIndividuals.length // only show if there are silenceSenderIndividuals
          }
        ]}
        setCheckedItems={setCheckedItems}
      />
      <BulkSilenceModalFooter
        disabled={checkedEmailsToBlock.length === 0}
        onBlock={onOpenBlockConfirm}
        onClose={onClose}
      />
      <ConfirmSilencingModal
        addressesToSilence={checkedEmailsToBlock}
        numSuggested={silenceSenderDomains.length + silenceSenderIndividuals.length}
        onClose={onCloseConfirmBlockModal}
        open={confirmBlockOpen}
      />
    </Dialog>
  );
};

export default BulkSilenceModal;
