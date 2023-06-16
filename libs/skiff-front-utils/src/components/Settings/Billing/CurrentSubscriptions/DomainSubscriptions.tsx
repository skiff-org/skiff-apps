import { useGetCurrentUserCustomDomainsQuery, useGetUserCustomDomainSubscriptionsInfoQuery } from 'skiff-front-graphql';
import { CustomDomainSubscriptionInfo } from 'skiff-graphql';
import { useRequiredCurrentUserData } from '../../../../apollo';
import DomainSubscriptionItem from './DomainSubscriptionItem';

function DomainSubscriptions() {
  const { userID } = useRequiredCurrentUserData();

  const { data } = useGetCurrentUserCustomDomainsQuery();
  const customDomains = data?.getCurrentUserCustomDomains.domains;

  const { data: customDomainSubscriptionsInfoData } = useGetUserCustomDomainSubscriptionsInfoQuery({
    variables: { request: { userID } }
  });
  const customDomainSubscriptionsInfo: CustomDomainSubscriptionInfo[] | null | undefined =
    customDomainSubscriptionsInfoData?.user?.customDomainSubscriptionsInfo;

  const skiffManagedCustomDomains = customDomains?.filter((customDomain) => customDomain.skiffManaged);

  return (
    <>
      {skiffManagedCustomDomains?.map((customDomain) => {
        const associatedSubscriptionInfo = customDomainSubscriptionsInfo?.find(
          (customDomainSubscriptionInfo) => customDomainSubscriptionInfo.domainID === customDomain.domainID
        );
        return (
          <DomainSubscriptionItem
            title={customDomain.domain}
            cancelAtPeriodEnd={associatedSubscriptionInfo?.cancelAtPeriodEnd}
            supposedEndDate={associatedSubscriptionInfo?.supposedEndDate}
          />
        );
      })}
    </>
  );
}

export default DomainSubscriptions;
