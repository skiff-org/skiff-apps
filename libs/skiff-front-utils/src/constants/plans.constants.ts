import { MonoTagProps } from '@skiff-org/skiff-ui';
import { SubscriptionPlan } from 'skiff-graphql';
import {
  PerIntervalPrice,
  PlanPrices,
  getStorageLimitInMb,
  TierName,
  getMaxCustomDomains,
  getAllowedNumberShortAliases,
  getMaxNumberNonWalletAliases,
  getMaxNumLabelsOrFolders,
  getMaxNumberMailFilters,
  MAXIMUM_STRIPE_PURCHASE_QUANTITY,
  getMaxUsersPerWorkspace,
  getUploadLimitInMb
} from 'skiff-utils';

import { getFormattedStorage } from '../utils/copyUtils';

export const subscriptionTiers = [SubscriptionPlan.Free, SubscriptionPlan.Pro, SubscriptionPlan.Business];
export const HIGHEST_TIER = SubscriptionPlan.Business;

export const MAIL_FREE_MAX_STORAGE_MB = 10000;

export const SPOTLIGHT_TEXT = 'Popular'; // tag copy for highlighted tier

const formatTierAllowance = (allowance: number) => {
  return allowance >= MAXIMUM_STRIPE_PURCHASE_QUANTITY ? 'Unlimited' : allowance.toString();
};

/**
 * Data for feature for a given tier
 * displayed in the feature table
 */

export interface FeatureData {
  value?: string;
  enabled?: boolean;
}

/**
 * Item for given feature in feature table.
 * Contains data for each tier and general
 * info.
 */
export interface FeatureItem {
  tiers: Record<SubscriptionPlan, FeatureData>;
  label: string; // feature name
  shortLabel?: string; // an abbreviated feature name
  hint: string; // description of feature
}

/* ******* DRIVE FEATUES ******** */
export const storageFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      value: getFormattedStorage(getStorageLimitInMb(TierName.Free))
    },
    [SubscriptionPlan.Essential]: {
      value: getFormattedStorage(getStorageLimitInMb(TierName.Essential))
    },
    [SubscriptionPlan.Pro]: {
      value: getFormattedStorage(getStorageLimitInMb(TierName.Pro))
    },
    [SubscriptionPlan.Business]: {
      value: getFormattedStorage(getStorageLimitInMb(TierName.Business))
    }
  },
  label: 'Storage',
  hint: 'Your storage space is shared between Mail, Pages, and Drive.'
};

export const uploadFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      value: getFormattedStorage(getUploadLimitInMb(TierName.Free))
    },
    [SubscriptionPlan.Essential]: {
      value: getFormattedStorage(getUploadLimitInMb(TierName.Essential))
    },
    [SubscriptionPlan.Pro]: {
      value: getFormattedStorage(getUploadLimitInMb(TierName.Pro))
    },
    [SubscriptionPlan.Business]: {
      value: getFormattedStorage(getUploadLimitInMb(TierName.Business))
    }
  },
  label: 'Per-file upload limit',
  hint: 'A per file size limit applies for any file uploaded to Skiff.'
};

const e2eeFileStorageFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      enabled: true
    },
    [SubscriptionPlan.Essential]: {
      enabled: true
    },
    [SubscriptionPlan.Pro]: {
      enabled: true
    },
    [SubscriptionPlan.Business]: {
      enabled: true
    }
  },
  label: 'E2EE file storage',
  hint: 'End-to-end encrypted storage means no one has access to your files but you.'
};

const e2eeLinkSharingFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      enabled: true
    },
    [SubscriptionPlan.Essential]: {
      enabled: true
    },
    [SubscriptionPlan.Pro]: {
      enabled: true
    },
    [SubscriptionPlan.Business]: {
      enabled: true
    }
  },
  label: 'E2EE link sharing',
  hint: 'Share files securely and privately.'
};

const decentralizedStorageFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      enabled: true
    },
    [SubscriptionPlan.Essential]: {
      enabled: true
    },
    [SubscriptionPlan.Pro]: {
      enabled: true
    },
    [SubscriptionPlan.Business]: {
      enabled: true
    }
  },
  label: 'Optional decentralized storage',
  hint: 'Encrypted static content is backed up across the IPFS network.'
};

const driveFeatures = [
  storageFeature,
  uploadFeature,
  e2eeFileStorageFeature,
  e2eeLinkSharingFeature,
  decentralizedStorageFeature
];

/* ******* MAIL FEATURES ******** */

const customDomainFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      enabled: false
    },
    [SubscriptionPlan.Essential]: {
      value: `${getMaxCustomDomains(TierName.Essential)}`
    },
    [SubscriptionPlan.Pro]: {
      value: `${getMaxCustomDomains(TierName.Pro)}`
    },
    [SubscriptionPlan.Business]: {
      value: `${getMaxCustomDomains(TierName.Business)}`
    }
  },
  label: 'Custom domains',
  hint: 'Choose a domain that fits your business or personal needs.'
};

export const shortAliasFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      enabled: false
    },
    [SubscriptionPlan.Essential]: {
      enabled: false
    },
    [SubscriptionPlan.Pro]: {
      value: `${getAllowedNumberShortAliases(TierName.Pro)}`
    },
    [SubscriptionPlan.Business]: {
      value: `${getAllowedNumberShortAliases(TierName.Business)}`
    }
  },
  label: 'Short aliases',
  hint: 'Claim an email alias that`s snappy and memorable.'
};

export const skiffAliasFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      value: `${getMaxNumberNonWalletAliases(TierName.Free)}`
    },
    [SubscriptionPlan.Essential]: {
      value: `${getMaxNumberNonWalletAliases(TierName.Essential)}`
    },
    [SubscriptionPlan.Pro]: {
      value: `${getMaxNumberNonWalletAliases(TierName.Pro)}`
    },
    [SubscriptionPlan.Business]: {
      value: `${getMaxNumberNonWalletAliases(TierName.Business)}`
    }
  },
  label: 'Skiff.com aliases',
  shortLabel: 'aliases',
  hint: 'Associate multiple aliases with a single @skiff.com account.'
};

const mailFilterFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      value: formatTierAllowance(getMaxNumberMailFilters(TierName.Free))
    },
    [SubscriptionPlan.Essential]: {
      value: formatTierAllowance(getMaxNumberMailFilters(TierName.Essential))
    },
    [SubscriptionPlan.Pro]: {
      value: formatTierAllowance(getMaxNumberMailFilters(TierName.Pro))
    },
    [SubscriptionPlan.Business]: {
      value: formatTierAllowance(getMaxNumberMailFilters(TierName.Business))
    }
  },
  label: 'Mail filters',
  hint: 'Stay organized with powerful, easy-to-use mail filters.'
};

const customSignatureFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      enabled: true
    },
    [SubscriptionPlan.Essential]: {
      enabled: true
    },
    [SubscriptionPlan.Pro]: {
      enabled: true
    },
    [SubscriptionPlan.Business]: {
      enabled: true
    }
  },
  label: 'Custom signatures',
  hint: 'Tailor your sign-off.'
};

const autoReplyFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      enabled: false
    },
    [SubscriptionPlan.Essential]: {
      enabled: true
    },
    [SubscriptionPlan.Pro]: {
      enabled: true
    },
    [SubscriptionPlan.Business]: {
      enabled: true
    }
  },
  label: 'Auto reply',
  hint: 'Save time and stay organized with auto reply.'
};

const scheduleSendFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      enabled: true
    },
    [SubscriptionPlan.Essential]: {
      enabled: true
    },
    [SubscriptionPlan.Pro]: {
      enabled: true
    },
    [SubscriptionPlan.Business]: {
      enabled: true
    }
  },
  label: 'Schedule send',
  hint: 'Write now, send later.'
};

const undoSendFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      enabled: true
    },
    [SubscriptionPlan.Essential]: {
      enabled: true
    },
    [SubscriptionPlan.Pro]: {
      enabled: true
    },
    [SubscriptionPlan.Business]: {
      enabled: true
    }
  },
  label: 'Undo send',
  hint: 'Skip the sinking feeling and easily revert sent messages.'
};

export const customFoldersLabelsFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      value: formatTierAllowance(getMaxNumLabelsOrFolders(TierName.Free))
    },
    [SubscriptionPlan.Essential]: {
      value: formatTierAllowance(getMaxNumLabelsOrFolders(TierName.Essential))
    },
    [SubscriptionPlan.Pro]: {
      value: formatTierAllowance(getMaxNumLabelsOrFolders(TierName.Pro))
    },
    [SubscriptionPlan.Business]: {
      value: formatTierAllowance(getMaxNumLabelsOrFolders(TierName.Business))
    }
  },
  label: 'Custom folders & labels',
  shortLabel: 'folders',
  hint: 'Keep your inbox organized with color-coded labels and folders.'
};

const mailFeatures = [
  customDomainFeature,
  shortAliasFeature,
  skiffAliasFeature,
  mailFilterFeature,
  customSignatureFeature,
  autoReplyFeature,
  scheduleSendFeature,
  undoSendFeature,
  customFoldersLabelsFeature
];

/* ******* PAGES FEATURES ******** */
const workspaceTypeFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      value: 'Shared & personal'
    },
    [SubscriptionPlan.Essential]: {
      value: 'Shared & personal'
    },
    [SubscriptionPlan.Pro]: {
      value: 'Shared & personal'
    },
    [SubscriptionPlan.Business]: {
      value: 'Shared & personal'
    }
  },
  label: 'Workspace type',
  hint: 'Skiff gives you 1 workspace to share and 1 that`s just for you.'
};

const numWorkspacesFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      value: '1'
    },
    [SubscriptionPlan.Essential]: {
      value: '1'
    },
    [SubscriptionPlan.Pro]: {
      value: '1'
    },
    [SubscriptionPlan.Business]: {
      value: '1'
    }
  },
  label: '# of shared workspaces',
  hint: 'Each tier offers a shared workspace designed for collaboration.'
};

const sharedCollaboratorsFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      value: formatTierAllowance(getMaxUsersPerWorkspace(TierName.Free))
    },
    [SubscriptionPlan.Essential]: {
      value: formatTierAllowance(getMaxUsersPerWorkspace(TierName.Essential))
    },
    [SubscriptionPlan.Pro]: {
      value: formatTierAllowance(getMaxUsersPerWorkspace(TierName.Pro))
    },
    [SubscriptionPlan.Business]: {
      value: formatTierAllowance(getMaxUsersPerWorkspace(TierName.Business))
    }
  },
  label: 'Collaborators per workspace',
  hint: 'The number of teammates or collaborators who can join your Skiff workspace.'
};

const historyFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      value: '24 hours'
    },
    [SubscriptionPlan.Essential]: {
      value: '24 hours'
    },
    [SubscriptionPlan.Pro]: {
      value: 'Unlimited'
    },
    [SubscriptionPlan.Business]: {
      value: 'Unlimited'
    }
  },
  label: 'Version history',
  hint: 'View past versions of your pages.'
};

const priorityFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      enabled: false
    },
    [SubscriptionPlan.Essential]: {
      enabled: false
    },
    [SubscriptionPlan.Pro]: {
      enabled: true
    },
    [SubscriptionPlan.Business]: {
      enabled: true
    }
  },
  label: 'Priority support',
  hint: "Reach our team at any time to help troubleshoot any issues you're having."
};

const fullSearchFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      enabled: true
    },
    [SubscriptionPlan.Essential]: {
      enabled: true
    },
    [SubscriptionPlan.Pro]: {
      enabled: true
    },
    [SubscriptionPlan.Business]: {
      enabled: true
    }
  },
  label: 'Text search',
  hint: 'Find any created page or shared page by searching through contents.'
};

const shareViaLinkFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      enabled: true
    },
    [SubscriptionPlan.Essential]: {
      enabled: true
    },
    [SubscriptionPlan.Pro]: {
      enabled: true
    },
    [SubscriptionPlan.Business]: {
      enabled: true
    }
  },
  label: 'Sharing via link',
  hint: 'Easily share your Pages with external contributors or collaborators.'
};

const e2eeFeature: FeatureItem = {
  tiers: {
    [SubscriptionPlan.Free]: {
      enabled: true
    },
    [SubscriptionPlan.Essential]: {
      enabled: true
    },
    [SubscriptionPlan.Pro]: {
      enabled: true
    },
    [SubscriptionPlan.Business]: {
      enabled: true
    }
  },
  label: 'End-to-end encryption',
  hint: 'Skiff uses Curve25519 and xsalsa20-poly1305 for asymmetric public-key authenticated encryption and secret-key authenticated encryption.'
};

const pagesFeatures = [
  workspaceTypeFeature,
  numWorkspacesFeature,
  sharedCollaboratorsFeature,
  historyFeature,
  priorityFeature,
  fullSearchFeature,
  shareViaLinkFeature,
  e2eeFeature
];

export enum FeatureSections {
  DRIVE = 'Drive',
  MAIL = 'Mail',
  PAGES = 'Pages'
}

export const allFeatures: Array<[FeatureSections, Array<FeatureItem>]> = [
  [FeatureSections.DRIVE, driveFeatures],
  [FeatureSections.MAIL, mailFeatures],
  [FeatureSections.PAGES, pagesFeatures]
];

export const narrowViewFeatures: Array<FeatureItem> = [
  storageFeature,
  uploadFeature,
  sharedCollaboratorsFeature,
  historyFeature,
  customDomainFeature,
  mailFilterFeature,
  priorityFeature
];

// high-salience features to be highlighted on abbreviated cards
export const planCardFeatures: Array<FeatureItem> = [
  customDomainFeature,
  storageFeature,
  skiffAliasFeature,
  customFoldersLabelsFeature
];

export const MONTHLY_PRICES_BY_SUBSCRIPTION_PLAN: Record<SubscriptionPlan, PerIntervalPrice> = {
  [SubscriptionPlan.Free]: { monthly: 0, yearly: 0 },
  [SubscriptionPlan.Essential]: { monthly: PlanPrices.EssentialMonthly, yearly: PlanPrices.EssentialYearly / 12 },
  [SubscriptionPlan.Pro]: { monthly: PlanPrices.ProMonthly, yearly: PlanPrices.ProYearly / 12 },
  [SubscriptionPlan.Business]: { monthly: PlanPrices.BusinessMonthly, yearly: PlanPrices.BusinessYearly / 12 }
};

export const MONO_TYPE_TAG_STYLES_BY_PLAN: Record<SubscriptionPlan, Omit<MonoTagProps, 'label'>> = {
  [SubscriptionPlan.Free]: {
    color: 'secondary'
  },
  [SubscriptionPlan.Essential]: {
    color: 'blue'
  },
  [SubscriptionPlan.Pro]: {
    color: 'green'
  },
  [SubscriptionPlan.Business]: {
    textColor: 'white',
    bgColor: 'var(--bg-emphasis)'
  }
};

// time after which we warn user via additional UI cues that paid plan is expiring soon
// Update to include two options for monthly and yearly in PROD-2445
export const EXPIRES_SOON_BUFFER_IN_MS = 1_000 * 60 * 60 * 24 * 7;

interface ColumnWidth {
  threeTiers?: string;
  fourTiers: string;
}
export const PLAN_TABLE_COLUMN_WIDTHS: Record<number, ColumnWidth> = {
  0: {
    // feature name column is wider
    threeTiers: '30%',
    fourTiers: '28%'
  },
  1: {
    threeTiers: '20%',
    fourTiers: '17%'
  },
  2: {
    //spotlight column is wider
    threeTiers: '25%',
    fourTiers: '21%'
  },
  3: {
    threeTiers: '25%',
    fourTiers: '17%'
  },
  4: {
    fourTiers: '17%'
  }
};

export const FEATURE_TABLE_RESPONSIVE_BREAKPOINT = 1160;
export const PLAN_CHANGE_POLL_INTERVAL = 1000;
