import { useGetUsersProfileDataQuery, useGetUserProfileDataQuery } from 'skiff-mail-graphql';

export const useUserProfile = (userID?: string) => {
  const res = useGetUsersProfileDataQuery({
    variables: {
      request: {
        userIDs: [userID || '']
      }
    },
    skip: !userID
  });
  return {
    ...res,
    data: res.data?.users?.[0]
  };
};

export const useUserProfileByUsername = (username?: string | null | undefined) => {
  const res = useGetUserProfileDataQuery({
    variables: {
      request: {
        username
      }
    },
    skip: !username
  });
  return res;
};

export const useUsersProfiles = (userIDs: string[]) => {
  const res = useGetUsersProfileDataQuery({
    variables: {
      request: {
        userIDs
      }
    }
  });
  return {
    ...res,
    data: res.data?.users
  };
};
