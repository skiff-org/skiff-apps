import { useRequiredCurrentUserData } from "../apollo/currentUser";
import { UserFeature } from "../generated/graphql";
import { useCurrentUserEmailAliases } from "./useCurrentUserEmailAliases";
import { useFeatureTag } from "./useUserTags";

export function useSkemailEnabled(): { shouldShowSkemail: boolean, skemailUserCreated: boolean } {
  const { userID } = useRequiredCurrentUserData();
  const emailAliases = useCurrentUserEmailAliases();
  const noEmailAliases = !emailAliases.length;
  const { value: showSkemailOnProd } = useFeatureTag(
    userID,
    UserFeature.SkemailEnabled // value is always boolean for this feature
  );
  const { origin } = window.location;
  const isProduction = origin.includes('app.skiff.com') || origin.includes('app.skiff.org');
  return {
    // If we're NOT on production, show skemail
    // If we ARE on production, show skemail only if feature flag enabled
    shouldShowSkemail: (!isProduction || showSkemailOnProd as boolean),
    skemailUserCreated: !noEmailAliases
  };
}
