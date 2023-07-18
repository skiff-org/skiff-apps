import { useFlags } from 'launchdarkly-react-client-sdk';
import { BannersAfterOnboardingFeatureFlag } from 'skiff-utils';

/**
 * Returns whether user should be exempted from banner exposure following participation in onboarding experiment.
 */

export default function useHideBannerForTreatmentCohort() {
  const featureFlags = useFlags();
  const showBannerAfterOnboardingPrompt = featureFlags.showBannersAfterOnboarding as BannersAfterOnboardingFeatureFlag;
  const onboardingExperimentCohort = featureFlags.onboardingRetentionFlow;
  const isInTreatmentCohort = onboardingExperimentCohort === 'steps' || onboardingExperimentCohort === 'checklist';
  // returns true for users not in control cohort who are exempted from banner exposure
  return isInTreatmentCohort && !showBannerAfterOnboardingPrompt;
}
