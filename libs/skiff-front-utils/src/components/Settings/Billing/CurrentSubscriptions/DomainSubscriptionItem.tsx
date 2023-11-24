import dayjs from 'dayjs';
import { Dropdown, DropdownItem, FilledVariant, Icon, Icons, IconButton } from 'nightwatch-ui';
import { useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useGetBillingPortalSessionUrlLazyQuery } from 'skiff-front-graphql';

import { useToast } from '../../../../hooks';

import SubscriptionItem from './SubscriptionItem';

interface DomainSubscriptionItemProps {
  title: string;
  cancelAtPeriodEnd: boolean | undefined;
  supposedEndDate: Date | undefined;
}
function DomainSubscriptionItem(props: DomainSubscriptionItemProps) {
  const { title, cancelAtPeriodEnd, supposedEndDate } = props;
  const { enqueueToast } = useToast();
  const [getBillingPortalSessionUrl] = useGetBillingPortalSessionUrlLazyQuery();

  const domainButtonRef = useRef<HTMLDivElement>(null);
  const [showAutoReneweDropdown, setShowAutoRenewDropdown] = useState(false);
  const renderDropdownItems = () => {
    return (
      <>
        <DropdownItem
          icon={Icon.Reload}
          key='update-auto-renew'
          label={`${cancelAtPeriodEnd ? 'Turn on' : 'Turn off'} auto-renew`}
          onClick={async () => {
            // Open Stripe portal to set subscription to cancel at period end
            // or un-cancel subscription previously set to cancel
            const { data } = await getBillingPortalSessionUrl({
              variables: { request: { redirectURL: window.location.href } }
            });
            if (data?.billingPortal?.url) {
              window.location.href = data.billingPortal.url;
            } else {
              enqueueToast({
                title: 'Failed to open billing portal',
                body: 'Please refresh and try again.'
              });
            }
            setShowAutoRenewDropdown(false);
          }}
          value='update-auto-renew'
        />
      </>
    );
  };
  return (
    <SubscriptionItem
      endAction={
        isMobile ? (
          <></>
        ) : (
          <>
            <IconButton
              icon={<Icons color='secondary' icon={Icon.OverflowH} />}
              onClick={() => setShowAutoRenewDropdown(true)}
              ref={domainButtonRef}
              variant={FilledVariant.UNFILLED}
            />
            <Dropdown
              buttonRef={domainButtonRef}
              portal
              setShowDropdown={setShowAutoRenewDropdown}
              showDropdown={showAutoReneweDropdown}
            >
              {renderDropdownItems()}
            </Dropdown>
          </>
        )
      }
      icon={Icon.At}
      subtitle={`${cancelAtPeriodEnd ? 'Expires' : 'Renews'} ${dayjs(supposedEndDate).format('MMM DD. YYYY')}`}
      title={title}
    />
  );
}

export default DomainSubscriptionItem;
