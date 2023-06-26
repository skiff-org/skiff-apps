"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFreeTrialInterval = exports.getFreeTrialDays = exports.getFreeTrialTier = void 0;
const constants_1 = require("./constants");
function getFreeTrialTier(trialIdentifier) {
    return constants_1.FREE_TRIALS[trialIdentifier].trialTier;
}
exports.getFreeTrialTier = getFreeTrialTier;
function getFreeTrialDays(trialIdentifier) {
    return constants_1.FREE_TRIALS[trialIdentifier].trialDays;
}
exports.getFreeTrialDays = getFreeTrialDays;
function getFreeTrialInterval(trialIdentifier) {
    return constants_1.FREE_TRIALS[trialIdentifier].trialTierInterval;
}
exports.getFreeTrialInterval = getFreeTrialInterval;
//# sourceMappingURL=freeTrialUtils.js.map