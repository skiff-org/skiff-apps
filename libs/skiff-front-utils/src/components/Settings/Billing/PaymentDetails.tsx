import { Typography, TypographySize, TypographyWeight } from '@skiff-org/skiff-ui';
import { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useGetBillingPortalSessionUrlLazyQuery } from 'skiff-front-graphql';

import TitleActionSection from '../TitleActionSection';

function PaymentDetails() {
  const [getBillingPortalSessionUrl] = useGetBillingPortalSessionUrlLazyQuery();
  const [loading, setLoading] = useState(false);

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
        <Typography mono uppercase size={TypographySize.LARGE} weight={TypographyWeight.MEDIUM}>
          Payment details
        </Typography>
      )}
      <TitleActionSection
        actions={[
          {
            onClick: () => void openStripe(),
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
