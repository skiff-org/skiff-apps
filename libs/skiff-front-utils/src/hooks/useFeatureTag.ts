import { useGetUserTagsQuery } from "skiff-front-graphql";
import { UserFeature } from "skiff-graphql";
import useFeatureTagValue from "./useFeatureTagValue";

/**
 * Hook to get the current user tags.
 * @param {string | undefined} userID - User's userID.
 * @returns Request, including tags.
 */
function useUserTags(userID: string, forceNetwork = false) {
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

function useFeatureTag(userID: string, tag: UserFeature, forceNetwork = false) {
  const { accountTags, ...res } = useUserTags(userID, forceNetwork);
  const value = useFeatureTagValue(accountTags ?? [], tag);
  return { ...res, value };
}

export default useFeatureTag;
