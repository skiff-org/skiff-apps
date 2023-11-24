export enum OnboardingUpsellFeatureFlag {
  CONTROL = 'control',
  SHOW_ESSENTIAL = 'essential',
  SHOW_BUSINESS = 'business'
}

export enum OnboardingRetentionFlowFeatureFlag {
  CONTROL = 'control',
  CHECKLIST = 'checklist',
  STEPS = 'steps'
}

export enum ActivationChecklistFeatureFlag {
  CONTROL = 'control',
  TRIAL = 'trial',
  CREDITS = 'credits'
}

export enum LDKey {
  ONBOARING_RETENTION_FLOW_EXPERIMENT = 'onboarding-retention-flow',
  SHOW_BANNER_AFTER_ONBOARDING_EXPERIMENT = 'show-banners-after-onboarding',
  SHOW_MAIL_APP_FOOTER_BUTTON = 'show-mail-app-footer-button',
  SEND_TRIAL_WILL_END_REMINDER = 'trial-will-cancel-reminder-email',
  ACTIVATION_CHECKLIST = 'activation-checklist',
  LOW_FREQUENCY_SENDER_THRESHOLD = 'low-frequency-sender-threshold',
  GLOBAL_DISABLE_ALIAS_LIMIT = 'global-disable-alias-limit',
  FREE_CUSTOM_DOMAIN = 'free-custom-domain',
  DECREASED_FREE_TIER_COLLABORATOR_LIMIT = 'decreased-free-tier-collaborator-limit',
  CUSTOM_DOMAIN_ONBOARDING_STEP = 'custom-domain-onboarding-step',
  BULK_ACTION_PAGE_LENGTH = 'bulk-action-page-length',
  EXEMPT_FROM_REFERRAL_MAX = 'exempt-from-referral-max',
  INDEX_THREAD_CONTENT_UPDATED_AT = 'index-thread-content-updated-at',
  LAZY_DOWNGRADE_ON_TIER_LOOKUP = 'lazy-downgrade-on-tier-lookup',
  BLACK_FRIDAY_DISCOUNT = 'black-friday-discount'
}

export const ONBOARDING_EXPERIMENT_LAUNCH_DATE = new Date('March 2, 2023 12:00:00 PST');

export enum FeatureFlag {
  TRASH = 'trash'
}

export enum LowFrequencySenderThresholdFlag {
  CONTROL = 'control',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum GlobalDisableAliasLimitFlag {
  CONTROL = 'control',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum BulkActionPageLengthFlag {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}
