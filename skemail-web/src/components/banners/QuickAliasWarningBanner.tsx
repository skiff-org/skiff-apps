import { Icon } from 'nightwatch-ui';
import React, { useEffect, useCallback } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { usePaidUpStatus } from 'skiff-front-graphql';
import { useSubscriptionPlan, useStoreWorkspaceEventMutation } from 'skiff-front-graphql';
import { DEFAULT_WORKSPACE_EVENT_VERSION, ThemedBanner, BannerTypes } from 'skiff-front-utils';
import { SubscriptionPlan, getTierNameFromSubscriptionPlan, WorkspaceEventType } from 'skiff-graphql';
import { getMaxNumQuickAliases, QUICK_ALIAS_LIMIT_WARNING_BUFFER } from 'skiff-utils';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';

interface QuickAliasWarningBannerProps {
  openPlansTab: () => void;
}

const QuickAliasWarningBanner: React.FC<QuickAliasWarningBannerProps> = ({ openPlansTab }) => {
  const dispatch = useDispatch();

  const {
    data: { downgradeProgress },
    refetch: refetchPaidUpStatus
  } = usePaidUpStatus();
  const {
    loading: subscriptionLoading,
    data: { activeSubscription }
  } = useSubscriptionPlan();
  const [storeWorkspaceEvent] = useStoreWorkspaceEventMutation();

  const isUserOnFreeTier = !subscriptionLoading && activeSubscription === SubscriptionPlan.Free;
  const currentTier = getTierNameFromSubscriptionPlan(activeSubscription);
  const maxQuickAliases = getMaxNumQuickAliases(currentTier);
  const isUserLimited = isUserOnFreeTier && !!downgradeProgress;

  const distanceToLimit = isUserLimited ? maxQuickAliases - downgradeProgress.quickAliases : Infinity;

  const isUserAtOrOverLimit = distanceToLimit <= 0;
  const isUserCloseToLimit = !isUserAtOrOverLimit && distanceToLimit <= QUICK_ALIAS_LIMIT_WARNING_BUFFER;

  const bannersOpen = useAppSelector((state) => state.modal.bannersOpen);
  const isQuickAliasWarningBannerOpen = bannersOpen.includes(BannerTypes.QuickAliasWarning);

  const shouldOpenBanner = isUserAtOrOverLimit || isUserCloseToLimit;

  const closeQuickAliasWarningBanner = useCallback(() => {
    dispatch(skemailModalReducer.actions.closeBanner(BannerTypes.QuickAliasWarning));
  }, [dispatch]);

  const openQuickAliasWarningBanner = useCallback(() => {
    dispatch(skemailModalReducer.actions.openBanner(BannerTypes.QuickAliasWarning));
  }, [dispatch]);

  useEffect(() => {
    if (shouldOpenBanner) {
      // refech to ensure that any adjustments a user has made are reflected
      void refetchPaidUpStatus();
      void storeWorkspaceEvent({
        variables: {
          request: {
            eventName: WorkspaceEventType.QuickAliasWarningBannerShown,
            data: currentTier,
            version: DEFAULT_WORKSPACE_EVENT_VERSION
          }
        }
      });
      openQuickAliasWarningBanner();
    } else {
      closeQuickAliasWarningBanner();
    }
  }, [
    storeWorkspaceEvent,
    refetchPaidUpStatus,
    openQuickAliasWarningBanner,
    closeQuickAliasWarningBanner,
    shouldOpenBanner,
    currentTier
  ]);

  if (!isQuickAliasWarningBannerOpen || !downgradeProgress) {
    return null;
  }

  const getLabel = () => {
    const baseLabel = isUserAtOrOverLimit
      ? "You're all out of Quick Aliases."
      : `You've used ${downgradeProgress.quickAliases} of ${maxQuickAliases} Quick Aliases.`;
    if (isMobile) {
      return baseLabel;
    }
    // if user has exceeded their storage allowance, there are now *passive* consequences to their delinquency
    // that they may not be aware of (they're missing new mail), so we prioritize that info over the general upgrade CTA
    return `${baseLabel} ${
      isUserAtOrOverLimit
        ? 'You will no longer receive mail at new aliases.'
        : 'You will soon be unable to create new aliases.'
    } Upgrade to unlock unlimited aliases.`;
  };

  const ctas = [
    {
      label: 'Upgrade',
      onClick: () => {
        void storeWorkspaceEvent({
          variables: {
            request: {
              eventName: WorkspaceEventType.QuickAliasWarningBannerClick,
              data: currentTier,
              version: DEFAULT_WORKSPACE_EVENT_VERSION
            }
          }
        });
        openPlansTab();
      }
    }
  ];

  return (
    <ThemedBanner
      color='yellow'
      ctas={ctas}
      icon={Icon.Bolt}
      label={getLabel()}
      onClose={closeQuickAliasWarningBanner}
    />
  );
};

export default QuickAliasWarningBanner;
