import { ButtonGroupItem, Dialog, DialogTypes } from 'nightwatch-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { useSubscriptionPlan } from 'skiff-front-graphql';
import { PaywallErrorCode } from 'skiff-utils';

import { getPaywallTitle, getPaywallDescription } from '../../../utils/paywallUtils';

interface PaywallModalProps {
  paywallErrorCode: PaywallErrorCode;
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

function PaywallModal(props: PaywallModalProps) {
  const { paywallErrorCode, onUpgrade, onClose, open } = props;
  const {
    loading: activeSubscriptionLoading,
    data: { activeSubscription }
  } = useSubscriptionPlan();
  const title = getPaywallTitle(paywallErrorCode);
  const description = getPaywallDescription(paywallErrorCode, activeSubscription);

  return (
    <Dialog
      description={description}
      onClose={onClose}
      open={!activeSubscriptionLoading && open}
      title={title}
      type={DialogTypes.Promotional}
    >
      <ButtonGroupItem
        key='upgrade'
        // Upgrading on mobile is not allowed with current Apple in-app purchase rules
        label={isMobile ? 'Back' : 'Upgrade'}
        onClick={() => {
          onClose();
          if (!isMobile) onUpgrade();
        }}
      />
    </Dialog>
  );
}

export default PaywallModal;
