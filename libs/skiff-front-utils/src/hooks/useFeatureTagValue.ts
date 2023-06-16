import { UserFeature } from 'skiff-graphql';

// example string to parse: "urn:sk:USER_FEATURES:STORAGE_LIMIT_BYTES=100000000"
const USER_TAG_RE = /^urn:sk:USER_FEATURES:(\S+)=(\S+)$/;

export const useFeatureTagValue = (accountTags: string[], tag: UserFeature): boolean | string => {
  // value of feature flag (true/false for boolean flags)
  let value: boolean | string = false;
  (accountTags ?? []).forEach((accountTag) => {
    if (accountTag.includes(tag)) {
      const groups = accountTag.match(USER_TAG_RE);
      if (groups && groups.length >= 3) {
        if (groups[2] === 'true') {
          value = true;
        } else {
          value = groups[2].toString();
        }
      }
    }
  });

  return value;
};

export default useFeatureTagValue;
