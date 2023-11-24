import { Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useGetBillingPortalSessionUrlLazyQuery, useSubscriptionPlan } from 'skiff-front-graphql';

import TitleActionSection from '../TitleActionSection';

const APPLE_STORE_SUBSCRIPTIONS = 'https://apps.apple.com/account/subscriptions';

const openAppleSubscriptionPage = () => {
  window.open(APPLE_STORE_SUBSCRIPTIONS, '_blank');
};

function PaymentDetails() {
  const [getBillingPortalSessionUrl] = useGetBillingPortalSessionUrlLazyQuery();
  const [loading, setLoading] = useState(false);

  const {
    data: { isAppleSubscription }
  } = useSubscriptionPlan();

  const openStripe = async () => {
    // Open Stripe portal to set subscription to cancel at period end
    // or un-cancel subscription previously set to cancel
    setLoading(true);
    const { data } = await getBillingPortalSessionUrl({
      variables: { request: { redirectURL: window.location.href } }
    });
    setLoading(false);
    if (data?.billingPortal?.url) {
      window.location.href = data?.billingPortal?.url;
    }
  };

  return (
    <>
      {!isMobile && (
        <Typography size={TypographySize.LARGE} weight={TypographyWeight.MEDIUM}>
          Payment details
        </Typography>
      )}
      <TitleActionSection
        actions={[
          {
            onClick: () => {
              if (isAppleSubscription) {
                openAppleSubscriptionPage();
              } else {
                void openStripe();
              }
            },
            label: 'Manage',
            type: 'button',
            loading: loading
          }
        ]}
        subtitle='Manage your card, billing address, and more'
        title='Update payment information'
      />
    </>
  );
}

export default PaymentDetails;
