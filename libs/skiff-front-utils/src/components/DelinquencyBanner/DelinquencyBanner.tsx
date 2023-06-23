import { useFlags } from 'launchdarkly-react-client-sdk';
import { Icon } from '@skiff-org/skiff-ui';
import React, { useState, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { usePaidUpStatus } from 'skiff-front-graphql';
import { useSubscriptionPlan } from 'skiff-front-graphql';
import { useStoreWorkspaceEventMutation } from 'skiff-front-graphql';
import { getTierNameFromSubscriptionPlan } from 'skiff-graphql';
import { WorkspaceEventType } from 'skiff-graphql';
import { PlanDelinquencyFlag } from 'skiff-utils';

import { HIGHEST_TIER } from '../../constants';
import { DEFAULT_WORKSPACE_EVENT_VERSION } from '../../constants';
import PlanDelinquencyModal from '../modals/PlanDelinquencyModal';
import ThemedBanner from '../ThemedBanner';

interface DelinquencyBannerProps {
  openPlansTab: () => void;
  onBannerClose?: () => void;
  onBannerOpen?: () => void;
}

const DelinquencyBanner: React.FC<DelinquencyBannerProps> = ({ openPlansTab, onBannerClose, onBannerOpen }) => {
  const [showPlanDelinquencyModal, setShowPlanDelinquencyModal] = useState(false);
  const {
    data: { paidUp, downgradeProgress },
    refetch: refetchPaidUpStatus
  } = usePaidUpStatus();
  const {
    loading: subscriptionLoading,
    data: { activeSubscription }
  } = useSubscriptionPlan();
  const [storeWorkspaceEvent] = useStoreWorkspaceEventMutation();
  const flags = useFlags();
  const enableDelinquency = flags.delinquencyEnabled as PlanDelinquencyFlag;
  const isUserOnHighestTier = activeSubscription === HIGHEST_TIER;
  // default to true if user is already on max tier, as we'd rather not pester them or block critical actions
  // even if they're in a technically delinquent state due to some legacy issue or bug
  const isUserPaidUp = enableDelinquency && !subscriptionLoading && !isUserOnHighestTier ? paidUp : true;
  // never shown if user is in good standing
  const shouldShowBanner = !isUserPaidUp;
  const currentTier = getTierNameFromSubscriptionPlan(activeSubscription);

  useEffect(() => {
    if (!shouldShowBanner) {
      onBannerClose?.();
      return;
    }
    // refech to ensure that any adjustments a user has made are reflected
    void refetchPaidUpStatus();
    void storeWorkspaceEvent({
      variables: {
        request: {
          eventName: WorkspaceEventType.DelinquencyBannerShown,
          data: currentTier,
          version: DEFAULT_WORKSPACE_EVENT_VERSION
        }
      }
    });
    onBannerOpen?.();
  }, [shouldShowBanner, storeWorkspaceEvent, currentTier, onBannerClose, onBannerOpen, refetchPaidUpStatus]);

  if (!shouldShowBanner) {
    return null;
  }

  // expectation is that free users will only see this if they've previously been on a paid plan (which is in theory only way to become delinquent)
  const label = `You're over the limit on your plan.${
    isMobile ? '' : ' Upgrade for access to custom domains, expanded storage, higher alias allowances, and more.'
  }`;

  const ctas = [
    {
      label: 'Check usage',
      onClick: () => {
        setShowPlanDelinquencyModal(true);
        void storeWorkspaceEvent({
          variables: {
            request: {
              eventName: WorkspaceEventType.DelinquencyBannerClick,
              data: currentTier,
              version: DEFAULT_WORKSPACE_EVENT_VERSION
            }
          }
        });
      }
    }
  ];

  return (
    <>
      <ThemedBanner color='red' ctas={ctas} icon={Icon.Warning} label={label} />
      {showPlanDelinquencyModal && (
        <PlanDelinquencyModal
          currentTier={currentTier}
          downgradeProgress={downgradeProgress}
          isFeatureAgnostic
          onClose={() => setShowPlanDelinquencyModal(false)}
          openPlansTab={openPlansTab}
          refetchPaidUpStatus={() => {
            void refetchPaidUpStatus();
          }}
        />
      )}
    </>
  );
};

export default DelinquencyBanner;
