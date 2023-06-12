import { FREE_TRIALS, FreeTrialIdentifier } from './constants';

export function getFreeTrialTier(trialIdentifier: FreeTrialIdentifier) {
  return FREE_TRIALS[trialIdentifier].trialTier;
}

export function getFreeTrialDays(trialIdentifier: FreeTrialIdentifier) {
  return FREE_TRIALS[trialIdentifier].trialDays;
}

export function getFreeTrialInterval(trialIdentifier: FreeTrialIdentifier) {
  return FREE_TRIALS[trialIdentifier].trialTierInterval;
}
