"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategorizedAliases = exports.isGenericSkiffAddress = exports.isCryptoAddress = exports.isWalletOrNameServiceAddress = exports.isWalletAddress = exports.isNameServiceAddress = exports.MAX_SIGNATURE_SIZE_KB = exports.isShortAlias = exports.removeDots = void 0;
const tslib_1 = require("tslib");
const partition_1 = tslib_1.__importDefault(require("lodash/partition"));
const isBtcAddress_1 = tslib_1.__importDefault(require("validator/lib/isBtcAddress"));
const isEthereumAddress_1 = tslib_1.__importDefault(require("validator/lib/isEthereumAddress"));
const constants_1 = require("../constants");
const customDomainUtils_1 = require("../customDomainUtils");
const isENSName_1 = require("../wallet/isENSName");
const walletUtils_1 = require("../walletUtils");
function removeDots(emailAlias) {
    return emailAlias.replaceAll('.', '');
}
exports.removeDots = removeDots;
function isShortAlias(address) {
    const [alias] = address.split('@');
    const aliasWithoutDots = removeDots(alias);
    return aliasWithoutDots.length < constants_1.SKIFF_ALIAS_MIN_LENGTH && aliasWithoutDots.length >= constants_1.SHORT_ALIAS_MIN_LENGTH;
}
exports.isShortAlias = isShortAlias;
exports.MAX_SIGNATURE_SIZE_KB = 500;
/**
 * Checks if the given alias is a wallet name service alias (e.g. ENS, ICNS)
 */
function isNameServiceAddress(emailAlias) {
    return (0, isENSName_1.isENSName)(emailAlias) || (0, walletUtils_1.isBonfidaName)(emailAlias) || (0, walletUtils_1.isICNSName)(emailAlias);
}
exports.isNameServiceAddress = isNameServiceAddress;
/**
 * Checks if the given alias is a wallet address.
 * @returns True if the alias is a wallet address. False otherwise.
 */
function isWalletAddress(emailAlias) {
    return ((0, isEthereumAddress_1.default)(emailAlias) ||
        (0, isBtcAddress_1.default)(emailAlias) ||
        (0, walletUtils_1.isSolanaAddress)(emailAlias) ||
        (0, walletUtils_1.isCosmosHubAddress)(emailAlias) ||
        (0, walletUtils_1.isJunoAddress)(emailAlias));
}
exports.isWalletAddress = isWalletAddress;
/**
 * Checks if the given alias is a wallet address.
 * @returns True if alias is a wallet address. False otherwise.
 */
function isWalletOrNameServiceAddress(emailAlias) {
    return isWalletAddress(emailAlias) || isNameServiceAddress(emailAlias);
}
exports.isWalletOrNameServiceAddress = isWalletOrNameServiceAddress;
/**
 * Checks if the given address is any crypto-associated address, including wallets, naming services, and e.g. UnstoppableDomains.
 * @returns True if address is a crypto address. False otherwise.
 */
function isCryptoAddress(emailAddress) {
    const [alias] = emailAddress.split('@');
    return isWalletOrNameServiceAddress(alias) || (0, walletUtils_1.isUDAddress)(emailAddress);
}
exports.isCryptoAddress = isCryptoAddress;
// only generic skiff addresses (i.e. ending in skiff.com, not in keplr.xyz) count against a user's alias budget
const isGenericSkiffAddress = (address) => {
    const domain = address.slice(address.lastIndexOf('@') + 1);
    return domain === (0, customDomainUtils_1.getMailDomain)();
};
exports.isGenericSkiffAddress = isGenericSkiffAddress;
/**
 * Sorts a user's aliases into relevant categories, particularly with respect to paid-tier limits.
 * @returns four categorized arrays. cryptoAliases and nonCryptoAliases have no overlap. genericSkiffAliases
 * are a subset of nonCryptoAliases, while shortSkiffAliases are a subset of genericSkiffAliases.
 */
function getCategorizedAliases(userEmailAliases) {
    const [cryptoAliases, nonCryptoAliases] = (0, partition_1.default)(userEmailAliases, isCryptoAddress);
    const genericSkiffAliases = nonCryptoAliases.filter(exports.isGenericSkiffAddress);
    const shortGenericSkiffAliases = genericSkiffAliases.filter(isShortAlias);
    return { cryptoAliases, nonCryptoAliases, genericSkiffAliases, shortGenericSkiffAliases };
}
exports.getCategorizedAliases = getCategorizedAliases;
//# sourceMappingURL=emailUtils.js.map