import { useCallback, useEffect, useState } from 'react';
import { useOrgMemberDefaultEmailAliasLazyQuery, useOrgMemberDefaultEmailAliasQuery } from 'skiff-front-graphql';

import { useRequiredCurrentUserData } from '../apollo';

type OrgMemberAliasRequest = { userID: string; username: string };

export default function useGetOrgMemberDefaultEmailAlias(userID: string, username: string, skip?: boolean) {
  const { userID: currentUserID, defaultEmailAlias } = useRequiredCurrentUserData();
  const isCurrentUser = userID === currentUserID;

  const { data, error } = useOrgMemberDefaultEmailAliasQuery({
    variables: {
      userId: userID
    },
    skip: skip || (isCurrentUser && !!defaultEmailAlias)
  });

  if (isCurrentUser && defaultEmailAlias) {
    return defaultEmailAlias;
  }

  // Use username as fallback if error or no alias returned
  if (!data?.orgMemberDefaultEmailAlias || error) {
    return username;
  }

  return data.orgMemberDefaultEmailAlias;
}

export function useGetOrgMemberDefaultEmailAliases(members: OrgMemberAliasRequest[]): {
  defaultEmailAliases: { [key: string]: string };
  loading: boolean;
} {
  const { userID: currentUserID, defaultEmailAlias } = useRequiredCurrentUserData();

  const [defaultEmailAliases, setDefaultEmailAliases] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(false);

  const [getOrgMemberDefaultEmailAlias] = useOrgMemberDefaultEmailAliasLazyQuery();

  const getEmailAliasForMember = useCallback(
    async (member: OrgMemberAliasRequest) => {
      if (defaultEmailAlias && member.userID === currentUserID) {
        setDefaultEmailAliases((prevData) => ({ ...prevData, [member.userID]: defaultEmailAlias }));
      } else {
        const { data, error } = await getOrgMemberDefaultEmailAlias({ variables: { userId: member.userID } });
        if (error) {
          console.error(`Failed to retrieve default email alias for ${member.username}`);
        }
        const emailAlias = data?.orgMemberDefaultEmailAlias ?? member.username;
        setDefaultEmailAliases((prevData) => ({ ...prevData, [member.userID]: emailAlias }));
      }
    },
    [currentUserID, defaultEmailAlias, getOrgMemberDefaultEmailAlias]
  );

  useEffect(() => {
    const getEmailAliases = async () => {
      setLoading(true);
      const getAliasPromises = members.map(getEmailAliasForMember);

      await Promise.allSettled(getAliasPromises);

      setLoading(false);
    };

    void getEmailAliases();
    // Using full array as dep causes infinite loop, can add memo to it but that'd be more expensive than the small computation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members.length, getEmailAliasForMember]);

  return {
    defaultEmailAliases,
    loading
  };
}
