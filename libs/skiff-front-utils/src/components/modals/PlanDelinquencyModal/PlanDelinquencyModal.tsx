import { useFlags } from 'launchdarkly-react-client-sdk';
import { Button, Dialog, DialogType, Size } from 'nightwatch-ui';
import React, { useEffect } from 'react';
import { useStoreWorkspaceEventMutation } from 'skiff-front-graphql';
import { DowngradeProgress } from 'skiff-graphql';
import { WorkspaceEventType } from 'skiff-graphql';
import { getMaxNumberNonWalletAliases, TierName } from 'skiff-utils';
import { FreeCustomDomainFeatureFlag } from 'skiff-utils';

import { DEFAULT_WORKSPACE_EVENT_VERSION } from '../../../constants';
import { useCurrentUserIsOrgAdmin } from '../../../hooks';
import { isMobileApp } from '../../../utils';
import { getDowngradeTodoItems } from '../../../utils';
import DowngradeTodoItem from '../../DowngradeTodoItem';

interface PlanDelinquencyModalProps {
  currentTier: TierName;
  downgradeProgress: DowngradeProgress | undefined;
  onClose: () => void;
  openPlansTab: () => void;
  refetchPaidUpStatus: () => void;
  delinquentAlias?: string; // defined if modal is blocking send from a delinquent alias
  isFeatureAgnostic?: boolean; // true if modal is NOT triggered by a specific user action (e.g. trying to apply a label or send an email)
}

/**
 * A modified version of the DowngradeModal that notifies users when they are no longer in
 * good standing with respect to paid features; i.e. they try to use a custom domain for which
 * they are no longer paying. Progress toward getting back in good standing is shown for
 * all features, not just those in delinquency, to emphasize benefits of reactivating a paid plan
 */

const PlanDelinquencyModal: React.FC<PlanDelinquencyModalProps> = ({
  currentTier,
  downgradeProgress,
  onClose,
  openPlansTab,
  refetchPaidUpStatus,
  delinquentAlias,
  isFeatureAgnostic
}) => {
  const isCurrentUserOrgAdmin = useCurrentUserIsOrgAdmin(); // non-admins can't upgrade
  const [storeWorkspaceEvent] = useStoreWorkspaceEventMutation();
  const showModal = !!downgradeProgress;
  const flags = useFlags();
  const freeCustomDomainFlag = flags.freeCustomDomain as FreeCustomDomainFeatureFlag;

  useEffect(() => {
    if (!showModal) return;
    // refech to ensure that any adjustments a user has made are reflected
    refetchPaidUpStatus();
    void storeWorkspaceEvent({
      variables: {
        request: {
          eventName: WorkspaceEventType.DelinquencyModalShown,
          data: currentTier,
          version: DEFAULT_WORKSPACE_EVENT_VERSION
        }
      }
    });
  }, [storeWorkspaceEvent, showModal, currentTier, refetchPaidUpStatus]);

  if (!showModal) return null;

  const todoItemPropsList = getDowngradeTodoItems(currentTier, { freeCustomDomainFlag }, downgradeProgress);
  const maxNumGenericSkiffAliases = getMaxNumberNonWalletAliases(currentTier);
  // if user has too many generic aliases, sending from any of them is blocked; other types of alias delinquency
  // allow users to send from non-delinquent aliases (e.g. a short alias is delinquent but not a long one)
  const isOverTotalAliasAllowance = downgradeProgress.emailAliases > maxNumGenericSkiffAliases;

  const getDescriptionCopy = () =>
    delinquentAlias
      ? `Action is needed to unlock sending from ${delinquentAlias} (you can still receive mail at this address${
          isOverTotalAliasAllowance ? '' : ' and send from other addresses). '
        }`
      : `Your ${currentTier} plan doesn't include this feature. `;

  const getCTACopy = () => {
    if (!isCurrentUserOrgAdmin) {
      return 'Contact your org admin to upgrade';
    }
    if (!isMobileApp()) {
      return `Upgrade to regain access to ${isFeatureAgnostic ? 'paid features' : 'this feature'}`;
    }
    return 'Review your plan at app.skiff.com'; // intentionally not linking in mobile app, due to Apple rules
  };

  return (
    <Dialog
      customContent
      description={`${
        isFeatureAgnostic ? '' : getDescriptionCopy()
      }${getCTACopy()}, or complete these actions to remain on your current plan.`}
      hideCloseButton
      onClose={onClose}
      open
      title={
        isFeatureAgnostic
          ? `You're over the limit on your ${currentTier} plan`
          : 'You no longer have access to this feature'
      }
      type={DialogType.DEFAULT}
    >
      {todoItemPropsList.map(({ key, ...props }) => (
        <DowngradeTodoItem {...props} key={key} />
      ))}
      <Button
        fullWidth
        onClick={() => {
          onClose();
          // can't visit plans tab on mobile app due to in-app purchase rules
          if (!isMobileApp()) {
            openPlansTab();
          }
          void storeWorkspaceEvent({
            variables: {
              request: {
                eventName: WorkspaceEventType.DelinquencyModalUpgradeClick,
                data: JSON.stringify({ ...downgradeProgress, currentTier }),
                version: DEFAULT_WORKSPACE_EVENT_VERSION
              }
            }
          });
        }}
        size={Size.LARGE}
      >
        {isMobileApp() || !isCurrentUserOrgAdmin ? 'Back' : 'Upgrade now'}
      </Button>
    </Dialog>
  );
};

export default PlanDelinquencyModal;
