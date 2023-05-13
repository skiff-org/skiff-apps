import { CustomCircularProgress, Skeleton, Typography } from 'nightwatch-ui';
import { useState } from 'react';
import { useGetUserCustomDomainSubscriptionsInfoQuery } from 'skiff-front-graphql';
import { TitleActionSection, useDefaultEmailAlias, useRequiredCurrentUserData } from 'skiff-front-utils';
import { CustomDomainRecord, CustomDomainSubscriptionInfo } from 'skiff-graphql';
import styled from 'styled-components';

import { useMaxCustomDomains } from '../../../../hooks/useMaxCustomDomains';
import { resolveAndSetENSDisplayName } from '../../../../utils/userUtils';

import ManageCustomDomainRow from './ManageCustomDomainRow';

const DomainsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  margin-top: 20px;
  width: 100%;
`;

interface ManageCustomDomainsProps {
  customDomains: CustomDomainRecord[] | undefined;
  loading: boolean;
  isPolling: boolean;
  refetchCustomDomains: () => void;
}

const ManageCustomDomains: React.FC<ManageCustomDomainsProps> = ({
  loading,
  customDomains,
  isPolling,
  refetchCustomDomains
}: ManageCustomDomainsProps) => {
  const [openDropdownID, setOpenDropdownID] = useState<string>();
  const user = useRequiredCurrentUserData();
  const { userID } = user;
  const [defaultEmailAlias, setDefaultEmailAlias] = useDefaultEmailAlias(userID, (newValue: string) => {
    void resolveAndSetENSDisplayName(newValue, user);
  });
  const { maxCustomDomains } = useMaxCustomDomains();

  const { data: customDomainSubscriptionsInfoData } = useGetUserCustomDomainSubscriptionsInfoQuery({
    variables: { request: { userID } }
  });
  const customDomainSubscriptionsInfo: CustomDomainSubscriptionInfo[] | null | undefined =
    customDomainSubscriptionsInfoData?.user?.customDomainSubscriptionsInfo;

  const renderDomainsUsed = () =>
    !loading && maxCustomDomains !== undefined && !!customDomains?.length ? (
      <Typography color='disabled'>
        {customDomains?.length ?? 0}/{maxCustomDomains} domains used
      </Typography>
    ) : (
      <></>
    );

  return (
    <>
      <TitleActionSection
        actions={[
          {
            type: 'custom',
            content: renderDomainsUsed()
          }
        ]}
        subtitle='Manage your Skiff Mail custom domains'
        title='Manage domains'
      />
      {/* Default state: Renders custom domain rows */}
      {!loading && (!!customDomains?.length || isPolling) && (
        <DomainsList>
          {!!customDomains?.length &&
            customDomains.map((customDomain) => {
              const associatedSubscriptionInfo = customDomainSubscriptionsInfo?.find(
                (customDomainSubscriptionInfo) => customDomainSubscriptionInfo.domainID === customDomain.domainID
              );
              // we use the db subscription record (which shadows Stripe's record) as the source of truth on renewal date and auto-renew status,
              // because we delete the associated db record when the Stripe subscription is cancelled
              const renewStatus = associatedSubscriptionInfo
                ? {
                    cancelAtPeriodEnd: associatedSubscriptionInfo.cancelAtPeriodEnd,
                    supposedEndDate: new Date(associatedSubscriptionInfo.supposedEndDate)
                  }
                : undefined;
              return (
                <ManageCustomDomainRow
                  customDomain={customDomain}
                  defaultEmailAlias={defaultEmailAlias}
                  dropdownOpen={customDomain.domainID === openDropdownID}
                  key={customDomain.domainID}
                  refetchCustomDomains={refetchCustomDomains}
                  renewStatus={renewStatus}
                  setDefaultEmailAlias={setDefaultEmailAlias}
                  setDropdownOpen={(open) => setOpenDropdownID(open ? customDomain.domainID : undefined)}
                />
              );
            })}

          {isPolling && <Skeleton height='60px' width='100%' borderRadius={6} />}
        </DomainsList>
      )}
      {/* Error state: Not loading, custom domains undefined */}
      {!loading && customDomains === undefined && (
        <Typography color='destructive'>Failed to load custom domains, please try again later.</Typography>
      )}
      {/* Loading state */}
      {loading && <CustomCircularProgress />}
    </>
  );
};

export default ManageCustomDomains;
