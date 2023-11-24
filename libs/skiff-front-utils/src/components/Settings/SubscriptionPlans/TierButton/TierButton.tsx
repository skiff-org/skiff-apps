import { Button, Size, Typography, TypographySize } from 'nightwatch-ui';
import { useState } from 'react';
import {
  useGetCheckoutSessionUrlOrStripeUpdateStatusLazyQuery,
  useStoreWorkspaceEventMutation,
  useSubscriptionPlan
} from 'skiff-front-graphql';
import {
  DowngradeProgress,
  getPlanRelation,
  getTierNameFromSubscriptionPlan,
  PlanRelation,
  RequestStatus,
  SubscriptionInterval,
  SubscriptionPlan,
  WorkspaceEventType
} from 'skiff-graphql';
import { TierName } from 'skiff-utils';
import styled from 'styled-components';

import { DEFAULT_WORKSPACE_EVENT_VERSION, PLAN_CHANGE_POLL_INTERVAL } from '../../../../constants';
import { useToast } from '../../../../hooks';
import {
  getBillingCycleTextColor,
  getTierButtonType,
  getTierLabel,
  getTierPrice,
  renderBillingCycleText
} from '../../../../utils';
import { ConfirmModal, DowngradeModal } from '../../../modals';
import PaidPlanTag from '../../../PaidPlanTag';
import PlanChangeConfirmModal from '../PlanChangeConfirmModal';
import PriceBlock from '../PriceBlock/PriceBlock';

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

const BillingCycleTextContainer = styled.div`
  padding-top: 8px;
  height: 16px;
`;
const Spacer = styled.div`
  height: 33px;
`;

type TierButtonProps = {
  activeSubscription: SubscriptionPlan;
  subscriptionPlan: SubscriptionPlan; // Subscription plan enum
  subscriptionInterval: SubscriptionInterval; // Monthly or yearly
  isUpdatingPlan: boolean;
  spotlightPlan: SubscriptionPlan;
  setIsUpdatingPlan: (isUpdating: boolean) => void;
  startPolling: (pollInterval: number) => void;
  openBillingPage: () => void;
};

export type DowngradeModalInfo = {
  downgradeProgress: DowngradeProgress;
  tierToDowngradeTo: TierName;
};

const TierButton = ({
  subscriptionPlan,
  subscriptionInterval,
  activeSubscription,
  spotlightPlan,
  isUpdatingPlan,
  setIsUpdatingPlan,
  startPolling,
  openBillingPage
}: TierButtonProps) => {
  const {
    loading,
    data: {
      isCryptoSubscription,
      isAppleSubscription,
      cancelAtPeriodEnd,
      supposedEndDate,
      stripeStatus,
      billingInterval: activeSubscriptionInterval
    }
  } = useSubscriptionPlan();
  const [getCheckoutSessionOrUpdatePlan] = useGetCheckoutSessionUrlOrStripeUpdateStatusLazyQuery({
    fetchPolicy: 'no-cache'
  });
  const [isUpgradeDowngradeConfirmOpen, setIsUpgradeDowngradeConfirmOpen] = useState(false);
  const [isIneligibleForUpgradeOpen, setIsIneligibleForUpgradeOpen] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [downgradeModalInfo, setDowngradeModalInfo] = useState<DowngradeModalInfo | null>(null);

  const { enqueueToast } = useToast();
  const [storeWorkspaceEvent] = useStoreWorkspaceEventMutation();

  const intendedTier = getTierNameFromSubscriptionPlan(subscriptionPlan);
  const activeTier = getTierNameFromSubscriptionPlan(activeSubscription);

  const planRelation = getPlanRelation({
    intendedTier,
    activeTier,
    intendedSubscriptionInterval: subscriptionInterval,
    activeSubscriptionInterval
  });

  if (loading) return null;

  const isNonStripeSubscription = isCryptoSubscription || isAppleSubscription;
  const isCurrentPlan = planRelation === PlanRelation.CURRENT;
  const activePlanIsFreeTier = activeSubscription === SubscriptionPlan.Free;
  const billWillNotProrate = activePlanIsFreeTier || isCurrentPlan || subscriptionPlan === SubscriptionPlan.Free;
  // PROD-2135: Add support for crypto cancellation reminders once we start cancelling crypto subs
  const shouldRenderBillingCycleText =
    !isCryptoSubscription &&
    isCurrentPlan &&
    !activePlanIsFreeTier &&
    supposedEndDate &&
    typeof cancelAtPeriodEnd !== 'undefined';

  const getCheckoutSession = async (
    intendedSubscription: SubscriptionPlan,
    intendedSubscriptionInterval: SubscriptionInterval,
    redirectURL: string
  ) => {
    try {
      const { data: getCheckoutSessionQueryData } = await getCheckoutSessionOrUpdatePlan({
        variables: {
          request: {
            subscriptionPlan: intendedSubscription,
            interval: intendedSubscriptionInterval,
            redirectURL
          }
        }
      });
      return getCheckoutSessionQueryData?.checkoutPortal;
    } catch (e) {
      console.error('Error in geting checkout session', e);
    }
  };

  const checkoutOrUpdatePlan = async (intendedSubscription: SubscriptionPlan) => {
    // set loading spinner on this button
    setIsButtonLoading(true);
    // deactivate all other tier buttons while plan change underway
    setIsUpdatingPlan(true);
    if (intendedTier !== activeTier) {
      void storeWorkspaceEvent({
        variables: {
          request: {
            eventName: WorkspaceEventType.PlanChangeStarted,
            data: JSON.stringify({ activeTier, intendedTier, planRelation }),
            version: DEFAULT_WORKSPACE_EVENT_VERSION
          }
        }
      });
    }
    const checkoutSession = await getCheckoutSession(intendedSubscription, subscriptionInterval, window.location.href);
    if (!checkoutSession) {
      setIsErrorModalOpen(true);
    } else if (checkoutSession.url) {
      window.location.href = checkoutSession.url;
    } else if (checkoutSession.status === RequestStatus.Saved) {
      // 'SAVED' status indicates a successful update via an API call
      startPolling(PLAN_CHANGE_POLL_INTERVAL);
      enqueueToast({
        title: 'Tier updated',
        body: `Plan successfully ${planRelation.toLowerCase()}d`
      });
      setIsButtonLoading(false);
      // return without resetting 'isUpdatingPlan' solely in this case; we don't update state until polling retrieves
      // updated subscription that comes down from Stripe
      return;
    } else if (checkoutSession.status === RequestStatus.Rejected && checkoutSession.downgradeProgress) {
      // 'REJECTED' with downgradeProgress indicates the user hasn't met criteria for a downgrade
      setDowngradeModalInfo({
        downgradeProgress: checkoutSession.downgradeProgress,
        tierToDowngradeTo: intendedTier
      });
    } else if (subscriptionPlan === SubscriptionPlan.Pro && checkoutSession.status === RequestStatus.Rejected) {
      // 'REJECTED' without downgrade progress indicates a user is trying to upgrade to Pro with too many users
      // possibly true for pre-Skiff 2.0 Free and Pro plans that have too many users in workspace
      setIsIneligibleForUpgradeOpen(true);
    } else {
      setIsErrorModalOpen(true);
    }
    setIsButtonLoading(false);
    setIsUpdatingPlan(false);
  };

  return (
    <>
      <SelectPlan>
        <div>
          <NameRow>
            <PaidPlanTag subscriptionPlan={subscriptionPlan} />
          </NameRow>
          <PriceBlock
            price={getTierPrice(subscriptionPlan, subscriptionInterval)}
            spotlightPlan={spotlightPlan}
            subscriptionPlan={subscriptionPlan}
          />
        </div>
        {/* prevent layout shift */}
        {isCryptoSubscription && !isCurrentPlan && <Spacer />}
        {/* Show button only if is neither apple/crypto subscription, or it's current plan */}
        {!(isNonStripeSubscription && !isCurrentPlan) && (
          <div>
            <Button
              disabled={
                isNonStripeSubscription ||
                isUpdatingPlan ||
                (isCurrentPlan && subscriptionPlan === SubscriptionPlan.Free)
              }
              loading={isButtonLoading}
              onClick={() => {
                // If this plan change won't result in an automatic proration, directly try checkout
                if (billWillNotProrate) {
                  // manage plan should take you to billing tab
                  if (
                    planRelation === PlanRelation.CURRENT &&
                    !(activeSubscription === SubscriptionPlan.Free || isNonStripeSubscription)
                  ) {
                    openBillingPage();
                  } else {
                    void checkoutOrUpdatePlan(subscriptionPlan);
                  }
                } else {
                  // confirm before making automatic plan changes via Stripe API
                  setIsUpgradeDowngradeConfirmOpen(true);
                }
              }} // is active plan
              size={Size.SMALL}
              type={getTierButtonType(planRelation)}
            >
              {getTierLabel(planRelation, activeSubscription, isNonStripeSubscription)}
            </Button>
            {downgradeModalInfo && (
              <DowngradeModal
                downgradeProgress={downgradeModalInfo.downgradeProgress}
                onClose={() => setDowngradeModalInfo(null)}
                open
                tierToDowngradeTo={downgradeModalInfo.tierToDowngradeTo}
              />
            )}
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
            {activeSubscriptionInterval &&
              stripeStatus && ( //these are defined for all good-standing stripe subscriptions
                <PlanChangeConfirmModal
                  activeSubscription={activeSubscription}
                  activeSubscriptionInterval={activeSubscriptionInterval}
                  activeSubscriptionStripeStatus={stripeStatus}
                  intendedSubscription={subscriptionPlan}
                  intendedSubscriptionInterval={subscriptionInterval}
                  onClose={() => setIsUpgradeDowngradeConfirmOpen(false)}
                  onConfirm={() => {
                    setIsUpgradeDowngradeConfirmOpen(false);
                    void checkoutOrUpdatePlan(subscriptionPlan);
                  }}
                  open={isUpgradeDowngradeConfirmOpen}
                  planRelation={planRelation}
                />
              )}
            <ConfirmModal
              confirmName='Upgrade to Business'
              description='You have too many collaborators in your workspace to use a Pro plan. Please upgrade to Business.'
              onClose={() => setIsIneligibleForUpgradeOpen(false)}
              onConfirm={() => {
                setIsIneligibleForUpgradeOpen(false);
                void checkoutOrUpdatePlan(SubscriptionPlan.Business);
              }}
              open={isIneligibleForUpgradeOpen}
              title={'Too many collaborators'}
            />
          </div>
        )}
      </SelectPlan>
      {/* container is always rendered to prevent layout shifts */}
      <BillingCycleTextContainer>
        {shouldRenderBillingCycleText && (
          <Typography color={getBillingCycleTextColor(cancelAtPeriodEnd)} size={TypographySize.CAPTION}>
            {renderBillingCycleText(supposedEndDate, cancelAtPeriodEnd)}
          </Typography>
        )}
      </BillingCycleTextContainer>
    </>
  );
};

export default TierButton;
