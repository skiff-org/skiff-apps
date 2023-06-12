import { LIMITS_BY_TIER, PaywallErrorCode, TierName } from './constants';

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

export function getMaxCustomDomains(tierName: TierName) {
  return LIMITS_BY_TIER[tierName].maxCustomDomains;
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
