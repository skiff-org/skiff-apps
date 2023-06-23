import dayjs from 'dayjs';
import {
  Button,
  Dropdown,
  DropdownItem,
  FilledVariant,
  Icon,
  Icons,
  IconButton,
  MonoTag,
  Type
} from '@skiff-org/skiff-ui';
import { useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useGetBillingPortalSessionUrlLazyQuery, useInvoiceHistory, useSubscriptionPlan } from 'skiff-front-graphql';
import { SubscriptionPlan } from 'skiff-graphql';
import { SubscriptionStates, upperCaseFirstLetter } from 'skiff-utils';
import styled from 'styled-components';

import { DowngradeModal } from '../../../modals';
import { TabPage } from '../../Settings.types';
import { DowngradeModalInfo } from '../../SubscriptionPlans/TierButton/TierButton';

import AdjustSeatsModal from './AdjustSeats/AdjustSeats';
import SubscriptionItem from './SubscriptionItem';

export interface TabProp {
  tab: TabPage;
}
interface TierSubscriptionProps {
  // Each app has it's own state to control the Settings modal
  openPlansPage: () => void;
}

const TagButton = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const formatStatusText = (status: string) => {
  return status
    .split('_')
    .map((word) => upperCaseFirstLetter(word.toLowerCase()))
    .join(' ');
};

const getStatusText = (status: SubscriptionStates) => {
  switch (status) {
    case SubscriptionStates.INCOMPLETE_EXPIRED:
    case SubscriptionStates.INCOMPLETE:
      return SubscriptionStates.INCOMPLETE;
    case SubscriptionStates.UNPAID:
    case SubscriptionStates.ACTIVE:
    case SubscriptionStates.TRIALING:
    case SubscriptionStates.CANCELLED:
    case SubscriptionStates.PAST_DUE:
    default:
      return status;
  }
};

const getStatusColor = (status: SubscriptionStates) => {
  switch (status) {
    case SubscriptionStates.ACTIVE:
      return 'green';
    case SubscriptionStates.PAST_DUE:
    case SubscriptionStates.INCOMPLETE_EXPIRED:
    case SubscriptionStates.INCOMPLETE:
    case SubscriptionStates.UNPAID:
      return 'red';
    case SubscriptionStates.TRIALING:
    case SubscriptionStates.CANCELLED:
    default:
      return undefined;
  }
};

const TierSubscription: React.FC<TierSubscriptionProps> = ({ openPlansPage }) => {
  const moreButtonRef = useRef<HTMLDivElement>(null);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [openAdjustModal, setOpenAdjustModal] = useState(false);
  const [getBillingPortalSessionUrl] = useGetBillingPortalSessionUrlLazyQuery();

  const {
    data: { supposedEndDate, cancelAtPeriodEnd, activeSubscription, billingInterval, stripeStatus, quantity },
    refetch: refetchSubscriptionPlan
  } = useSubscriptionPlan();

  const { refetch: refetchInvoiceHistory } = useInvoiceHistory();

  const [downgradeModalInfo, setDowngradeModalInfo] = useState<DowngradeModalInfo | null>(null);

  const openStripePlan = async (e?: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // Open Stripe portal to set subscription to cancel at period end
    // or un-cancel subscription previously set to cancel
    const { data } = await getBillingPortalSessionUrl({
      variables: { request: { redirectURL: window.location.href } }
    });
    if (data?.billingPortal?.url) {
      window.location.href = data?.billingPortal?.url;
    }
    setShowMoreDropdown(false);
  };

  const isBusiness = activeSubscription === SubscriptionPlan.Business;
  const statusColor = stripeStatus ? getStatusColor(stripeStatus as SubscriptionStates) : undefined;

  const renderDropdownItems = () => {
    return (
      <>
        {isBusiness && (
          <DropdownItem
            icon={Icon.User}
            key='adjust-seats'
            label='Adjust seats'
            onClick={() => {
              setOpenAdjustModal(true);
              setShowMoreDropdown(false);
            }}
            value='adjust-seats'
          />
        )}
        <DropdownItem
          icon={Icon.Map}
          key='change-plan'
          label='Change plan'
          onClick={openPlansPage}
          value='change-plan'
        />
      </>
    );
  };

  return (
    <>
      <SubscriptionItem
        endAction={
          cancelAtPeriodEnd ? (
            <>
              {!isMobile && (
                <Button onClick={() => openStripePlan()} type={Type.SECONDARY}>
                  Renew plan
                </Button>
              )}
            </>
          ) : (
            <>
              <TagButton>
                {!!stripeStatus && (
                  <MonoTag
                    bgColor={!statusColor ? 'var(--bg-overlay-tertiary)' : undefined}
                    color={statusColor}
                    label={formatStatusText(getStatusText(stripeStatus as SubscriptionStates))}
                  />
                )}
                {!isMobile && (
                  <IconButton
                    icon={<Icons color='secondary' icon={Icon.OverflowH} />}
                    onClick={() => setShowMoreDropdown(true)}
                    ref={moreButtonRef}
                    variant={FilledVariant.UNFILLED}
                  />
                )}
              </TagButton>
              {!isMobile && (
                <Dropdown
                  buttonRef={moreButtonRef}
                  portal
                  setShowDropdown={setShowMoreDropdown}
                  showDropdown={showMoreDropdown}
                >
                  {renderDropdownItems()}
                </Dropdown>
              )}
              {downgradeModalInfo && (
                <DowngradeModal
                  downgradeProgress={downgradeModalInfo.downgradeProgress}
                  onClose={() => setDowngradeModalInfo(null)}
                  open
                  tierToDowngradeTo={downgradeModalInfo.tierToDowngradeTo}
                />
              )}
            </>
          )
        }
        icon={Icon.Map}
        subtitle={`${cancelAtPeriodEnd ? 'Expires' : 'Renews'} ${dayjs(supposedEndDate).format('MMM DD. YYYY')}`}
        title={`${
          billingInterval ? `${upperCaseFirstLetter(billingInterval)} ` : ''
        }${activeSubscription.toLowerCase()} plan`}
      />
      <AdjustSeatsModal
        activeSubscriptionBillingInterval={billingInterval}
        allocatedSeats={quantity}
        onClose={() => setOpenAdjustModal(false)}
        open={openAdjustModal}
        refetch={() => {
          refetchInvoiceHistory();
          refetchSubscriptionPlan();
        }}
      />
    </>
  );
};

export default TierSubscription;
