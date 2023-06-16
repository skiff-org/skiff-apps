import React from 'react';
import { SubscriptionInterval, SubscriptionPlan, PlanRelation } from 'skiff-graphql';
import { upperCaseFirstLetter } from 'skiff-utils';
import { SubscriptionStates } from 'skiff-utils';

import { getSubscriptionIntervalTitle, getTierTitle } from '../../../utils/planUtils';
import ConfirmModal from '../../modals/ConfirmModal';

type PlanChangeConfirmModalProps = {
  open: boolean;
  activeSubscription: SubscriptionPlan;
  intendedSubscription: SubscriptionPlan;
  planRelation: PlanRelation;
  activeSubscriptionStripeStatus: string;
  intendedSubscriptionInterval: SubscriptionInterval;
  activeSubscriptionInterval: SubscriptionInterval;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * Modal to confirm whether a user wants to make a plan change that will result in an
 * immediate charge or proration in their Stripe bill.
 */
function PlanChangeConfirmModal(props: PlanChangeConfirmModalProps) {
  const {
    open,
    intendedSubscription,
    activeSubscription,
    planRelation,
    activeSubscriptionStripeStatus,
    intendedSubscriptionInterval,
    activeSubscriptionInterval,
    onConfirm,
    onClose
  } = props;

  const getPlanName = (
    subscriptionPlan: SubscriptionPlan,
    subscriptionInterval: SubscriptionInterval,
    isIntervalChange: boolean
  ) => {
    return `${getTierTitle(subscriptionPlan)}${
      isIntervalChange ? ` ${getSubscriptionIntervalTitle(subscriptionInterval)}` : ''
    }`;
  };

  const isOnFreeTrial = activeSubscriptionStripeStatus === SubscriptionStates.TRIALING;
  const isIntervalChange = activeSubscriptionInterval !== intendedSubscriptionInterval;
  const activePlanTitle = getPlanName(activeSubscription, activeSubscriptionInterval, isIntervalChange);
  const intendedPlanTitle = getPlanName(intendedSubscription, intendedSubscriptionInterval, isIntervalChange);

  return (
    <ConfirmModal
      confirmName={isOnFreeTrial ? 'End trial' : upperCaseFirstLetter(planRelation)}
      description={`Would you like to ${
        isOnFreeTrial ? 'end your free trial and ' : ''
      }${planRelation.toLowerCase()} from ${activePlanTitle} to ${intendedPlanTitle}? ${
        isOnFreeTrial ? 'Your card will be charged' : 'Your bill will be prorated'
      }.`}
      onClose={onClose}
      onConfirm={onConfirm}
      open={open}
      title={
        isOnFreeTrial
          ? `End trial and ${upperCaseFirstLetter(planRelation)}?`
          : `${upperCaseFirstLetter(planRelation)} to ${intendedPlanTitle}`
      }
    />
  );
}

export default PlanChangeConfirmModal;
