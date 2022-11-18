import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ApplyCreditsModal, getCreditCentsForInfoType } from 'skiff-front-utils';
import { SubscriptionPlan, EntityType, CreditInfo } from 'skiff-graphql';
import { useApplyCreditsToStripeMutation, useGetCreditsQuery } from 'skiff-mail-graphql';

import { useRequiredCurrentUserData } from '../../apollo/currentUser';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { getCheckoutSessionOrUpdatePlan } from '../../utils/paymentUtils';
import { getSubscriptionPlan, storeWorkspaceEvent } from '../../utils/userUtils';

interface SkemailApplyCreditsModalProps {
  open: boolean;
  closeModal: () => void;
}

/**
 * This component is a wrapper around the ApplyCreditsModal component
 * in skiff-front-utils and handles/provides all needed Editor specific logic (graphql, redux, etc)
 */
const SkemailApplyCreditsModal: React.FC<SkemailApplyCreditsModalProps> = ({ open, closeModal }) => {
  const [activeSubscriptionPlan, setActiveSubscriptionPlan] = useState<SubscriptionPlan>(SubscriptionPlan.Free);

  const dispatch = useDispatch();
  const { userID } = useRequiredCurrentUserData();
  // Fetch users credit info
  const { data, refetch } = useGetCreditsQuery({
    variables: {
      request: {
        entityID: userID,
        entityType: EntityType.User,
        include: [CreditInfo.CurrentCredits]
      }
    }
  });

  const { credits: creditsResponse } = data || {};
  const creditInfo = creditsResponse?.credits || [];

  const currentCreditCents = getCreditCentsForInfoType(creditInfo, CreditInfo.CurrentCredits) ?? 0;

  useEffect(() => {
    const fetchSubscriptionPlan = async () => {
      try {
        const {
          data: { activeSubscription }
        } = await getSubscriptionPlan(userID);

        setActiveSubscriptionPlan(activeSubscription);
      } catch (e) {
        console.error('Failed to fetch active subscription', e);
      }
    };
    void fetchSubscriptionPlan();
  }, [userID]);

  const [applyCreditsToStripe] = useApplyCreditsToStripeMutation();

  const onSuccess = () => {
    void refetch();
  };

  const handleApplyCreditsToStripe = (cents: number) => {
    return applyCreditsToStripe({
      variables: { request: { entityID: userID, entityType: EntityType.User, cents } }
    });
  };

  const openAddEmailModal = useCallback(
    () => dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.AddEmail })),
    [dispatch]
  );

  return (
    <ApplyCreditsModal
      activeSubscription={activeSubscriptionPlan}
      applyCreditsToStripe={handleApplyCreditsToStripe}
      currentCreditCents={currentCreditCents}
      getCheckoutSession={getCheckoutSessionOrUpdatePlan}
      onClose={closeModal}
      onSuccess={onSuccess}
      open={open}
      openAddEmailModal={openAddEmailModal}
      storeWorkspaceEvent={(eventName, eventData, version) => void storeWorkspaceEvent(eventName, eventData, version)}
    />
  );
};

export default SkemailApplyCreditsModal;
