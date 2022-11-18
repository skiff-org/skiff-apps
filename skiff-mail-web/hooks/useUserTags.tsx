/* eslint-disable import/prefer-default-export */
import { getEnvironment, useFeatureTagValue } from 'skiff-front-utils';
import { UserFeature } from 'skiff-graphql';
import { useGetUserTagsQuery } from 'skiff-mail-graphql';

/**
 * Hook to get the current user tags.
 * @param {string | undefined} userID - User's userID.
 * @returns Request, including tags.
 */
export function useUserTags(userID: string, forceNetwork = false) {
  const res = useGetUserTagsQuery({
    variables: {
      request: {
        userID
      }
    },
    skip: !userID,
    fetchPolicy: forceNetwork ? 'network-only' : 'cache-first'
  });
  return {
    ...res,
    accountTags: res.data?.user?.accountTags
  };
}

export function useFeatureTag(userID: string, tag: UserFeature, forceNetwork = false) {
  const { accountTags, ...res } = useUserTags(userID, forceNetwork);

  const value = useFeatureTagValue(accountTags ?? [], tag);
  return { ...res, value };
}
