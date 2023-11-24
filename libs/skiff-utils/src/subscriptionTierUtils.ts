import {
  GLOBAL_MAX_NUM_QUICK_ALIASES,
  MAXIMUM_STRIPE_PURCHASE_QUANTITY,
  PaywallErrorCode,
  TierName
} from './constants';
import { FreeCustomDomainFeatureFlag } from './featureFlag.types';

interface FlagConditionedLimit {
  defaultLimit: number;
  flagLimit?: number;
}

interface TierLimits {
  maxStorageInMb: number;
  maxUploadLimitInMb: number;
  maxNumNonWalletAliases: number;
  maxCustomDomains: FlagConditionedLimit;
  allowedNumShortAliases: number;
  maxNumLabelsOrFolders: number;
  messagesPerDay: number;
  maxUsersPerWorkspace: number;
  autoReplyEnabled: boolean;
  unlimitedVersionHistory: boolean;
  maxNumMailFilters: number;
  maxAliasesInactive: number;
  catchallAliasEnabled: boolean;
  editAliasProfileEnabled: boolean;
  maxQuickAliasSubdomains: number;
  maxInactiveQuickAliasSubdomains: number;
  // only limited at Free tier
  maxNumQuickAliases: number;
  // send from Quick Alias (reply is allowed across all tiers)
  sendFromQuickAliasEnabled: boolean;
  replyFromQuickAliasEnabled: boolean;
}

// this record should not be accessed directly; rather,
// the getter util functions in this file should be used
const LIMITS_BY_TIER: Record<TierName, TierLimits> = {
  [TierName.Free]: {
    maxStorageInMb: 10000,
    maxUploadLimitInMb: 5000, // 5 GB
    maxNumNonWalletAliases: 4,
    maxCustomDomains: {
      defaultLimit: 0,
      flagLimit: 1
    },
    allowedNumShortAliases: 0,
    messagesPerDay: 200,
    maxNumLabelsOrFolders: 5,
    maxUsersPerWorkspace: 4,
    autoReplyEnabled: false,
    unlimitedVersionHistory: false,
    maxNumMailFilters: 2,
    maxAliasesInactive: 2,
    catchallAliasEnabled: false,
    editAliasProfileEnabled: true,
    maxQuickAliasSubdomains: 1,
    maxInactiveQuickAliasSubdomains: 3,
    maxNumQuickAliases: 10,
    sendFromQuickAliasEnabled: false,
    replyFromQuickAliasEnabled: true
  },
  [TierName.Essential]: {
    maxStorageInMb: 15000,
    maxUploadLimitInMb: 5000, // 5 GB
    maxNumNonWalletAliases: 10,
    maxCustomDomains: { defaultLimit: 1 },
    allowedNumShortAliases: 0,
    messagesPerDay: 200,
    maxNumLabelsOrFolders: Infinity,
    maxUsersPerWorkspace: 6,
    autoReplyEnabled: true,
    unlimitedVersionHistory: false,
    maxNumMailFilters: Infinity,
    maxAliasesInactive: 6,
    catchallAliasEnabled: true,
    editAliasProfileEnabled: true,
    maxQuickAliasSubdomains: 1,
    maxInactiveQuickAliasSubdomains: 3,
    maxNumQuickAliases: GLOBAL_MAX_NUM_QUICK_ALIASES,
    sendFromQuickAliasEnabled: true,
    replyFromQuickAliasEnabled: true
  },
  [TierName.Pro]: {
    maxStorageInMb: 200000,
    maxUploadLimitInMb: 50000, // 50 GB
    maxNumNonWalletAliases: 15,
    maxCustomDomains: { defaultLimit: 3 },
    allowedNumShortAliases: 1,
    messagesPerDay: Infinity,
    maxNumLabelsOrFolders: Infinity,
    maxUsersPerWorkspace: 6,
    autoReplyEnabled: true,
    unlimitedVersionHistory: true,
    maxNumMailFilters: Infinity,
    maxAliasesInactive: 10,
    catchallAliasEnabled: true,
    editAliasProfileEnabled: true,
    maxQuickAliasSubdomains: 2,
    maxInactiveQuickAliasSubdomains: 3,
    maxNumQuickAliases: GLOBAL_MAX_NUM_QUICK_ALIASES,
    sendFromQuickAliasEnabled: true,
    replyFromQuickAliasEnabled: true
  },
  [TierName.Business]: {
    maxStorageInMb: 1000000,
    maxUploadLimitInMb: 150000, // 150 GB
    maxNumNonWalletAliases: 15,
    maxCustomDomains: { defaultLimit: 15 },
    allowedNumShortAliases: 2,
    messagesPerDay: Infinity,
    maxNumLabelsOrFolders: Infinity,
    maxUsersPerWorkspace: MAXIMUM_STRIPE_PURCHASE_QUANTITY,
    autoReplyEnabled: true,
    unlimitedVersionHistory: true,
    maxNumMailFilters: Infinity,
    maxAliasesInactive: 20,
    catchallAliasEnabled: true,
    editAliasProfileEnabled: true,
    maxQuickAliasSubdomains: 5,
    maxInactiveQuickAliasSubdomains: 3,
    maxNumQuickAliases: GLOBAL_MAX_NUM_QUICK_ALIASES,
    sendFromQuickAliasEnabled: true,
    replyFromQuickAliasEnabled: true
  }
};

const getFlagConditionedLimit = (flagConditionedLimit: FlagConditionedLimit, flag: boolean) => {
  const defaultLimit = flagConditionedLimit.defaultLimit;
  const flagLimit = flagConditionedLimit.flagLimit ?? defaultLimit;
  return flag ? flagLimit : defaultLimit;
};

// Checks if a given ApolloError's code is a PaywallErrorCode
export function isPaywallErrorCode(errorCode: string) {
  return Object.values(PaywallErrorCode).includes(errorCode as PaywallErrorCode);
}

export function getStorageLimitInMb(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].maxStorageInMb;
}

export function getUploadLimitInMb(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].maxUploadLimitInMb;
}

export function getMaxCustomDomains(tierName: TierName, freeCustomDomainFlag: FreeCustomDomainFeatureFlag) {
  return getFlagConditionedLimit(LIMITS_BY_TIER[tierName].maxCustomDomains, freeCustomDomainFlag);
}

export function getMaxQuickAliasSubdomains(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].maxQuickAliasSubdomains;
}

export function getMaxNumberNonWalletAliases(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].maxNumNonWalletAliases;
}

export function getAllowedNumberShortAliases(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].allowedNumShortAliases;
}

export function getMaxMessagesPerDay(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].messagesPerDay;
}

export function getMaxNumLabelsOrFolders(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].maxNumLabelsOrFolders;
}

export function getMaxUsersPerWorkspace(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].maxUsersPerWorkspace;
}

export function getAutoreplyEnabled(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].autoReplyEnabled;
}

export function getUnlimitedVersionHistoryEnabled(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].unlimitedVersionHistory;
}

export function getMaxNumberMailFilters(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].maxNumMailFilters;
}

export function getMaxInactiveAliases(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].maxAliasesInactive;
}

export function getCatchallAliasEnabled(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].catchallAliasEnabled;
}

export function getEditAliasProfileEnabled(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].editAliasProfileEnabled;
}

export function getMaxInactiveQuickAliasSubdomains(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].maxInactiveQuickAliasSubdomains;
}

export function getMaxNumQuickAliases(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].maxNumQuickAliases;
}

export function getSendFromQuickAliasEnabled(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].sendFromQuickAliasEnabled;
}

export function getReplyFromQuickAliasEnabled(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].replyFromQuickAliasEnabled;
}

export function getMaxNumberQuickAliasSubdomains(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].maxQuickAliasSubdomains;
}

export function getMaxNumberQuickAliases(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].maxNumQuickAliases;
}
