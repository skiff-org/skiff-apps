"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMaxInactiveAliases = exports.getMaxNumberMailFilters = exports.getUnlimitedVersionHistoryEnabled = exports.getAutoreplyEnabled = exports.getMaxUsersPerWorkspace = exports.getMaxNumLabelsOrFolders = exports.getMaxMessagesPerDay = exports.getAllowedNumberShortAliases = exports.getMaxNumberNonWalletAliases = exports.getMaxCustomDomains = exports.getUploadLimitInMb = exports.getStorageLimitInMb = exports.isPaywallErrorCode = void 0;
const constants_1 = require("./constants");
// Checks if a given ApolloError's code is a PaywallErrorCode
function isPaywallErrorCode(errorCode) {
    return Object.values(constants_1.PaywallErrorCode).includes(errorCode);
}
exports.isPaywallErrorCode = isPaywallErrorCode;
function getStorageLimitInMb(tierName) {
    return constants_1.LIMITS_BY_TIER[tierName].maxStorageInMb;
}
exports.getStorageLimitInMb = getStorageLimitInMb;
function getUploadLimitInMb(tierName) {
    return constants_1.LIMITS_BY_TIER[tierName].maxUploadLimitInMb;
}
exports.getUploadLimitInMb = getUploadLimitInMb;
function getMaxCustomDomains(tierName) {
    return constants_1.LIMITS_BY_TIER[tierName].maxCustomDomains;
}
exports.getMaxCustomDomains = getMaxCustomDomains;
function getMaxNumberNonWalletAliases(tierName) {
    return constants_1.LIMITS_BY_TIER[tierName].maxNumNonWalletAliases;
}
exports.getMaxNumberNonWalletAliases = getMaxNumberNonWalletAliases;
function getAllowedNumberShortAliases(tierName) {
    return constants_1.LIMITS_BY_TIER[tierName].allowedNumShortAliases;
}
exports.getAllowedNumberShortAliases = getAllowedNumberShortAliases;
function getMaxMessagesPerDay(tierName) {
    return constants_1.LIMITS_BY_TIER[tierName].messagesPerDay;
}
exports.getMaxMessagesPerDay = getMaxMessagesPerDay;
function getMaxNumLabelsOrFolders(tierName) {
    return constants_1.LIMITS_BY_TIER[tierName].maxNumLabelsOrFolders;
}
exports.getMaxNumLabelsOrFolders = getMaxNumLabelsOrFolders;
function getMaxUsersPerWorkspace(tierName) {
    return constants_1.LIMITS_BY_TIER[tierName].maxUsersPerWorkspace;
}
exports.getMaxUsersPerWorkspace = getMaxUsersPerWorkspace;
function getAutoreplyEnabled(tierName) {
    return constants_1.LIMITS_BY_TIER[tierName].autoReplyEnabled;
}
exports.getAutoreplyEnabled = getAutoreplyEnabled;
function getUnlimitedVersionHistoryEnabled(tierName) {
    return constants_1.LIMITS_BY_TIER[tierName].unlimitedVersionHistory;
}
exports.getUnlimitedVersionHistoryEnabled = getUnlimitedVersionHistoryEnabled;
function getMaxNumberMailFilters(tierName) {
    return constants_1.LIMITS_BY_TIER[tierName].maxNumMailFilters;
}
exports.getMaxNumberMailFilters = getMaxNumberMailFilters;
function getMaxInactiveAliases(tierName) {
    return constants_1.LIMITS_BY_TIER[tierName].maxAliasesInactive;
}
exports.getMaxInactiveAliases = getMaxInactiveAliases;
//# sourceMappingURL=subscriptionTierUtils.js.map