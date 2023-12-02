import { ConfirmModal, useToast } from 'skiff-front-utils';
import { SilenceSenderBulkSuggestion } from 'skiff-graphql';

import { unsilenceSenders } from '../../../utils/silencingUtils';

interface ConfirmNotNoiseModalProps {
  confirmNotNoiseOpen: boolean;
  setConfirmNotNoiseOpen: (open: boolean) => void;
  emailAddress: string;
  isMarkNotNoise: boolean;
  isParent?: boolean;
  domainSenders?: Array<SilenceSenderBulkSuggestion>;
  closeBanner?: () => void;
}

export const ConfirmNotNoiseModal: React.FC<ConfirmNotNoiseModalProps> = ({
  confirmNotNoiseOpen,
  setConfirmNotNoiseOpen,
  emailAddress,
  isMarkNotNoise,
  isParent,
  domainSenders,
  closeBanner
}: ConfirmNotNoiseModalProps) => {
  const { enqueueToast } = useToast();

  const onCloseNotNoiseModal = () => setConfirmNotNoiseOpen(false);

  return (
    <ConfirmModal
      confirmName='Confirm'
      description={`You will continue to receive emails from ${
        isParent && domainSenders?.length ? `these ${domainSenders.length} addresses` : emailAddress
      }.`}
      onClose={(e?: React.MouseEvent) => {
        e?.stopPropagation();
        setConfirmNotNoiseOpen(false);
      }}
      onConfirm={(e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (isParent && domainSenders) {
          const childAddresses = domainSenders.map((child) => child.sender);
          void unsilenceSenders(childAddresses, enqueueToast, onCloseNotNoiseModal, isMarkNotNoise);
        } else {
          void unsilenceSenders([emailAddress], enqueueToast, onCloseNotNoiseModal, isMarkNotNoise);
        }
        closeBanner?.();
      }}
      open={confirmNotNoiseOpen}
      title={
        isMarkNotNoise
          ? `Mark ${isParent && domainSenders?.length ? `all ${domainSenders.length} senders` : 'sender'} as not noise`
          : `Unsilence ${isParent && domainSenders?.length ? `all ${domainSenders.length} senders` : 'sender'}`
      }
    />
  );
};
