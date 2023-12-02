export enum QuickAliasTutorialState {
  INPUT,
  SENT
}

export const ILLUSTRATION_BREAKPOINT = 1148;

export enum QuickAliasOnboardingStep {
  SPLASH = 'SPLASH',
  SUBDOMAIN = 'SUBDOMAIN',
  TUTORIAL = 'TUTORIAL'
}

export const STEPS = [
  QuickAliasOnboardingStep.SPLASH,
  QuickAliasOnboardingStep.SUBDOMAIN,
  QuickAliasOnboardingStep.TUTORIAL
];
