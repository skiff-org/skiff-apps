import { Button, Typography, Icon } from 'nightwatch-ui';
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  ConfirmModal,
  DEFAULT_WORKSPACE_EVENT_VERSION,
  PlanRelation,
  PlanPrices,
  usePrevious,
  PLANS_TABLE_POLL_INTERVAL,
  PriceBlock,
  spotlightPlan,
  SPOTLIGHT_TEXT,
  useToast,
  TierButtonProps
} from 'skiff-front-utils';
import {
  SubscriptionInterval,
  SubscriptionPlan,
  WorkspaceEventType,
  RequestStatus,
  getTierNameFromSubscriptionPlan
} from 'skiff-graphql';
import { upperCaseFirstLetter } from 'skiff-utils';
import styled from 'styled-components';

import { useRequiredCurrentUserData } from '../../../../../apollo/currentUser';
import { skemailModalReducer } from '../../../../../redux/reducers/modalReducer';
import { ModalType } from '../../../../../redux/reducers/modalTypes';
import { getCheckoutSessionOrUpdatePlan } from '../../../../../utils/paymentUtils';
import { useSubscriptionPlan } from '../../../../../utils/userUtils';
import { storeWorkspaceEvent } from '../../../../../utils/userUtils';

const NameRow = styled.div`
  display: flex;
  gap: 12px;
`;

const SelectPlan = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
`;

const SpotlightTagContainer = styled.div`
  align-items: center;
  background-color: var(--accent-green-secondary);
  border-radius: 6px;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  padding: 0px 8px;
  width: fit-content;
  height: 20px;
`;

const getTierPrice = (planRelation: SubscriptionPlan, subscriptionInterval: SubscriptionInterval) => {
  switch (planRelation) {
    case SubscriptionPlan.Free: {
      return 0;
    }
    case SubscriptionPlan.Pro: {
      return subscriptionInterval === SubscriptionInterval.Monthly ? PlanPrices.ProMonthly : PlanPrices.ProAnnual;
    }
    case SubscriptionPlan.Business: {
      return subscriptionInterval === SubscriptionInterval.Monthly
        ? PlanPrices.BusinessMonthly
        : PlanPrices.BusinessAnnual;
    }
  }
};

export const getTierTitle = (planRelation: SubscriptionPlan) => {
  switch (planRelation) {
    case SubscriptionPlan.Free: {
      return 'Free';
    }
    case SubscriptionPlan.Pro: {
      return 'Pro';
    }
    case SubscriptionPlan.Business: {
      return 'Business';
    }
  }
};

/**
 * Returns a number indicating whether a reference plan is before, or after,
 * or is the same as the given plan in upgrade order.
 * @param {SubscriptionPlan} tierButtonPlan - The subscription plan type associated with this button.
 * @param {SubscriptionPlan} activeSubscription - The user's current subscription plan.
 * @returns {PlanRelation}
 */
function comparePlans(tierButtonPlan: SubscriptionPlan, activeSubscription: SubscriptionPlan): PlanRelation {
  switch (tierButtonPlan) {
    case SubscriptionPlan.Business: {
      if (activeSubscription !== SubscriptionPlan.Business) {
        return PlanRelation.UPGRADE;
      } else {
        return PlanRelation.CURRENT;
      }
    }
    case SubscriptionPlan.Pro: {
      if (activeSubscription === SubscriptionPlan.Business) {
        return PlanRelation.DOWNGRADE;
      } else if (activeSubscription === SubscriptionPlan.Free) {
        return PlanRelation.UPGRADE;
      } else {
        return PlanRelation.CURRENT;
      }
    }
    case SubscriptionPlan.Free: {
      if (activeSubscription !== SubscriptionPlan.Free) {
        return PlanRelation.DOWNGRADE;
      } else {
        return PlanRelation.CURRENT;
      }
    }
  }
}

const getTierLabel = (
  planRelation: PlanRelation,
  activeSubscription: SubscriptionPlan,
  isCryptoSubscription?: boolean
) => {
  switch (planRelation) {
    case PlanRelation.CURRENT: {
      const label =
        activeSubscription === SubscriptionPlan.Free || isCryptoSubscription ? 'Current plan' : 'Manage plan';
      return label;
    }
    case PlanRelation.DOWNGRADE: {
      return 'Downgrade';
    }
    case PlanRelation.UPGRADE: {
      return 'Upgrade';
    }
  }
};

const getTierType = (planRelation: PlanRelation) => {
  switch (planRelation) {
    case PlanRelation.CURRENT: {
      return 'primary';
    }
    case PlanRelation.DOWNGRADE: {
      return 'destructive';
    }
    case PlanRelation.UPGRADE: {
      return 'primary';
    }
  }
};

/**
 * Button that displays a price for a tier and a button
 * to upgrade/dowgrade to that tier
 */
function TierButton({
  subscriptionInterval,
  subscriptionPlan,
  activeSubscription,
  isUpdatingPlan,
  setIsUpdatingPlan,
  startPolling,
  stopPolling
}: TierButtonProps) {
  const { userID } = useRequiredCurrentUserData();

  const {
    loading,
    data: { isCryptoSubscription }
  } = useSubscriptionPlan(userID);

  const dispatch = useDispatch();
  const { enqueueToast } = useToast();
  const planRelation = comparePlans(subscriptionPlan, activeSubscription);
  const [isUpgradeDowngradeConfirmOpen, setIsUpgradeDowngradeConfirmOpen] = useState(false);
  const [isIneligibleProConfirmOpen, setIsIneligibleProConfirmOpen] = useState(false);
  // Open modal
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const previousActiveSubscription = usePrevious(activeSubscription);

  useEffect(() => {
    if (isUpdatingPlan && activeSubscription !== previousActiveSubscription) {
      stopPolling();
      setIsUpdatingPlan(false);
    }
  }, [isUpdatingPlan, activeSubscription, previousActiveSubscription, stopPolling, setIsUpdatingPlan]);

  if (loading) return null;

  const checkoutOrUpdatePlan = async (intendedSubscription: SubscriptionPlan) => {
    void storeWorkspaceEvent(WorkspaceEventType.UpgradeStarted, planRelation, DEFAULT_WORKSPACE_EVENT_VERSION);
    const checkoutSession = await getCheckoutSessionOrUpdatePlan(intendedSubscription, subscriptionInterval);
    if (checkoutSession.url) {
      window.location.href = checkoutSession.url;
    } else if (checkoutSession.status === RequestStatus.Saved) {
      // 'SAVED' status indicates a successful update via an API call
      startPolling(PLANS_TABLE_POLL_INTERVAL);
      setIsUpdatingPlan(true);
      enqueueToast({
        body: `Plan successfully ${planRelation.toLowerCase()}d`,
        position: {
          vertical: 'top',
          horizontal: 'center'
        },
        icon: Icon.Map
      });
    } else if (checkoutSession.status === RequestStatus.Rejected && checkoutSession.downgradeProgress) {
      // 'REJECTED' with downgradeProgress indicates the user hasn't met criteria for a downgrade
      const tierToDowngradeTo = getTierNameFromSubscriptionPlan(subscriptionPlan);
      dispatch(
        skemailModalReducer.actions.setOpenModal({
          type: ModalType.Downgrade,
          downgradeProgress: checkoutSession.downgradeProgress,
          tierToDowngradeTo
        })
      );
    } else if (subscriptionPlan === SubscriptionPlan.Pro && checkoutSession.status === RequestStatus.Rejected) {
      // 'REJECTED' without downgrade progress indicates a user is trying to upgrade to Pro with too many users
      // possibly true for pre-Skiff 2.0 Free and Pro plans that have too many users in workspace
      setIsIneligibleProConfirmOpen(true);
    } else {
      setIsErrorModalOpen(true);
    }
  };

  return (
    <SelectPlan>
      <div>
        <NameRow>
          <Typography color='secondary'>{getTierTitle(subscriptionPlan)}</Typography>
          {subscriptionPlan === spotlightPlan && (
            <SpotlightTagContainer>
              <Typography color='green' level={4} type='label'>
                {SPOTLIGHT_TEXT}
              </Typography>
            </SpotlightTagContainer>
          )}
        </NameRow>
        <PriceBlock price={getTierPrice(subscriptionPlan, subscriptionInterval)} subscriptionPlan={subscriptionPlan} />
      </div>
      {/* Don't show button if we paid with crypto and want to change. */}
      {!(isCryptoSubscription && planRelation !== PlanRelation.CURRENT) && (
        <div>
          <Button
            disabled={
              isCryptoSubscription ||
              isUpdatingPlan ||
              (planRelation === PlanRelation.CURRENT && subscriptionPlan === SubscriptionPlan.Free)
            }
            onClick={() => {
              // If user doesn't have an active paid plan or is managing current plan, directly try checkout
              if (activeSubscription === SubscriptionPlan.Free || planRelation === PlanRelation.CURRENT) {
                void checkoutOrUpdatePlan(subscriptionPlan);
              } else {
                // confirm before making automatic plan changes via Stripe API
                setIsUpgradeDowngradeConfirmOpen(true);
              }
            }} // is active plan
            type={getTierType(planRelation)}
          >
            {getTierLabel(planRelation, activeSubscription, isCryptoSubscription)}
          </Button>
          <ConfirmModal
            confirmName='Send email'
            description='There was an error when attempting to check out. Please contact support@skiff.org for assistance.'
            onClose={() => setIsErrorModalOpen(false)}
            onConfirm={() => {
              setIsErrorModalOpen(true);
              window.open('mailto:support@skiff.org', '_blank');
            }}
            open={isErrorModalOpen}
            title={'Checkout error'}
          />
          <ConfirmModal
            confirmName={upperCaseFirstLetter(planRelation)}
            description={`Would you like to ${planRelation.toLowerCase()} your subscription plan? Your bill will be prorated.`}
            onClose={() => setIsUpgradeDowngradeConfirmOpen(false)}
            onConfirm={() => {
              setIsUpgradeDowngradeConfirmOpen(false);
              void checkoutOrUpdatePlan(subscriptionPlan);
            }}
            open={isUpgradeDowngradeConfirmOpen}
            title={`${upperCaseFirstLetter(planRelation)} your plan`}
          />
          <ConfirmModal
            confirmName={'Upgrade to Business'}
            description={
              'You have too many collaborators in your workspace to use a Pro plan. Please upgrade to Business.'
            }
            onClose={() => setIsIneligibleProConfirmOpen(false)}
            onConfirm={() => {
              setIsIneligibleProConfirmOpen(false);
              void checkoutOrUpdatePlan(SubscriptionPlan.Business);
            }}
            open={isIneligibleProConfirmOpen}
            title={'Too many collaborators'}
          />
        </div>
      )}
    </SelectPlan>
  );
}

export default TierButton;
