/* eslint-disable import/prefer-default-export */
import { useState, useEffect } from "react";
import { useGetUserTagsQuery, UserFeature } from "../generated/graphql";

// example string to parse: "urn:sk:USER_FEATURES:STORAGE_LIMIT_BYTES=100000000"
const USER_TAG_RE = /^urn:sk:USER_FEATURES:(\S+)=(\S+)$/;

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
  // value of feature flag (true/false for boolean flags)
  const [value, setValue] = useState<boolean | string>(false);

  useEffect(() => {
    if (!accountTags) {
      return;
    }
    let tagPresent = false;
    accountTags.forEach((accountTag) => {
      if (accountTag.includes(tag)) {
        tagPresent = true;
        const groups = accountTag.match(USER_TAG_RE);
        if (groups && groups.length >= 3) {
          if (groups[2] === 'true') {
            setValue(true);
          } else {
            setValue(groups[2].toString());
          }
        }
      }
    });
    if (!tagPresent) {
      setValue(false);
    }
  }, [accountTags, tag]);
  return { ...res, value };
}
