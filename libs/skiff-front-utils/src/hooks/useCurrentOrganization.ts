import { useGetOrganizationQuery } from 'skiff-front-graphql';

import { useRequiredCurrentUserData } from '../apollo';

// Similar to useActiveOrganization in react-client
// but without the navigation logic
const useCurrentOrganization = () => {
  const { rootOrgID } = useRequiredCurrentUserData();

  const orgRes = useGetOrganizationQuery({
    variables: { id: rootOrgID },
    skip: !rootOrgID
  });

  return orgRes;
};

export default useCurrentOrganization;
