import { useFlags } from 'launchdarkly-react-client-sdk';
import { BannersAfterOnboardingFeatureFlag, OnboardingRetentionFlowFeatureFlag } from 'skiff-utils';

/**
 * Returns whether user should be exempted from banner exposure following participation in onboarding experiment.
 */

export default function useHideBannerForTreatmentCohort() {
  const featureFlags = useFlags();
  const showBannerAfterOnboardingPrompt = featureFlags.showBannersAfterOnboarding as BannersAfterOnboardingFeatureFlag;
  const onboardingExperimentCohort = featureFlags.onboardingRetentionFlow as OnboardingRetentionFlowFeatureFlag;
  const isInTreatmentCohort =
    onboardingExperimentCohort === OnboardingRetentionFlowFeatureFlag.STEPS ||
    onboardingExperimentCohort === OnboardingRetentionFlowFeatureFlag.CHECKLIST;
  // returns true for users not in control cohort who are exempted from banner exposure
  return isInTreatmentCohort && !showBannerAfterOnboardingPrompt;
}
