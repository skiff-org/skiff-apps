import { useDispatch } from 'react-redux';
import { usePaidUpStatus, useSubscriptionPlan } from 'skiff-front-graphql';
import { HIGHEST_TIER, useGetFF } from 'skiff-front-utils';
import { getTierNameFromSubscriptionPlan } from 'skiff-graphql';
import { PlanDelinquencyFlag } from 'skiff-utils';

import { skemailModalReducer } from '../redux/reducers/modalReducer';
import { ModalType } from '../redux/reducers/modalTypes';
/**
 * Returns whether a user is in good paid-up status with respect to current paid feature access,
 * and a helper for opening the delinquency modal following relevant actions if not.
 */
export function usePlanDelinquency() {
  const {
    data: { paidUp, downgradeProgress }
  } = usePaidUpStatus();
  const {
    data: { activeSubscription },
    loading: activeSubscriptionLoading
  } = useSubscriptionPlan();
  const currentTier = getTierNameFromSubscriptionPlan(activeSubscription);
  const enableDelinquency = useGetFF<PlanDelinquencyFlag>('delinquencyEnabled');

  const isUserOnHighestTier = activeSubscription === HIGHEST_TIER;
  // default to true if user is already on max tier, as we'd rather not pester them or block critical actions
  // even if they're in a technically delinquent state due to some legacy issue or bug
  const isUserPaidUp = enableDelinquency && !isUserOnHighestTier && !activeSubscriptionLoading ? paidUp : true;

  const dispatch = useDispatch();
  const openPlanDelinquencyModal = (delinquentAlias?: string) => {
    dispatch(
      skemailModalReducer.actions.setOpenModal({
        type: ModalType.PlanDelinquency,
        currentTier,
        downgradeProgress,
        delinquentAlias
      })
    );
  };
  return { isUserPaidUp, downgradeProgress, openPlanDelinquencyModal };
}
