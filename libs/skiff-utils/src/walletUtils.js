"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isICNSName = exports.isBonfidaName = exports.isUDAddress = exports.recoverEthereumAddressAndCheckMatch = exports.getCosmosHubAddress = exports.getJunoAddress = exports.isJunoAddress = exports.isCosmosHubAddress = exports.isSolanaAddress = void 0;
const tslib_1 = require("tslib");
const bech32_1 = require("@cosmjs/encoding/build/bech32");
const hex_1 = require("@cosmjs/encoding/build/hex");
const bech32_2 = require("@keplr-wallet/cosmos/build/bech32");
const eth_sig_util_1 = require("@metamask/eth-sig-util");
const isBase58_1 = tslib_1.__importDefault(require("validator/lib/isBase58"));
const constants_1 = require("./constants");
const walletUtils_constants_1 = require("./walletUtils.constants");
/**
 * Checks if the given alias is a Solana address.
 * @returns True if the alias is a Solana wallet address. False otherwise.
 */
function isSolanaAddress(publicAddress) {
    // Solana addresses are at least 32 chars long.
    // We must check for the length as well as the base encoding as aliases that
    // are not wallet address such as 'test' will return isBase58 as true
    return publicAddress.length >= 32 && (0, isBase58_1.default)(publicAddress);
}
exports.isSolanaAddress = isSolanaAddress;
function isCosmosAddress(publicAddress, prefix) {
    // Cosmos addresses are bech32 encoded addresses with an HRP depending on the zone
    // https://docs.cosmos.network/master/spec/addresses/bech32.html
    try {
        bech32_2.Bech32Address.validate(publicAddress, prefix);
        return true;
    }
    catch (_e) {
        return false;
    }
}
/**
 * Checks if the given alias is a Cosmos Hub address
 * @returns True if the email address is a valid Cosmos Hub address. False otherwise.
 */
function isCosmosHubAddress(publicAddress) {
    return isCosmosAddress(publicAddress, constants_1.COSMOS_HUB_PREFIX);
}
exports.isCosmosHubAddress = isCosmosHubAddress;
/**
 * Checks if the given alias is a Juno address
 * @returns True if the email address is a valid Juno address. False otherwise.
 */
function isJunoAddress(publicAddress) {
    return isCosmosAddress(publicAddress, constants_1.JUNO_PREFIX);
}
exports.isJunoAddress = isJunoAddress;
/**
 * Converts Cosmos Hub address to Juno address
 */
function getJunoAddress(cosmosHubAddress) {
    if (!isCosmosHubAddress(cosmosHubAddress)) {
        throw new Error('Not a Cosmos Hub address');
    }
    const { data } = (0, bech32_1.fromBech32)(cosmosHubAddress);
    return (0, bech32_1.toBech32)(constants_1.JUNO_PREFIX, (0, hex_1.fromHex)((0, hex_1.toHex)(data)));
}
exports.getJunoAddress = getJunoAddress;
/**
 * Converts Juno address to CosmosHub address
 */
function getCosmosHubAddress(junoAddress) {
    if (!isJunoAddress(junoAddress)) {
        throw new Error('Not a Juno address');
    }
    const { data } = (0, bech32_1.fromBech32)(junoAddress);
    return (0, bech32_1.toBech32)(constants_1.COSMOS_HUB_PREFIX, (0, hex_1.fromHex)((0, hex_1.toHex)(data)));
}
exports.getCosmosHubAddress = getCosmosHubAddress;
/**
 * Recover address given signature and challenge. Then, check whether it matches public address.
 * @param {string} publicAddress - Public address.
 * @param {string} challengeJwt - Challenge string.
 * @param {string} challengeSignature - Signature.
 * @returns {boolean} Whether recovered address matches.
 */
function recoverEthereumAddressAndCheckMatch(publicAddress, challengeJwt, challengeSignature) {
    const signedData = {
        domain: {
            name: 'Skiff',
            version: '0.1'
        },
        primaryType: 'Token',
        message: {
            contents: 'Skiff signature',
            skiffLoginToken: challengeJwt
        },
        types: {
            EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' }
            ],
            Token: [
                { name: 'skiffLoginToken', type: 'string' },
                { name: 'contents', type: 'string' }
            ]
        }
    };
    try {
        const recoveredAddress = (0, eth_sig_util_1.recoverTypedSignature)({
            data: signedData,
            signature: challengeSignature,
            version: eth_sig_util_1.SignTypedDataVersion.V4
        });
        // noting - ethereum addresses are case insensitive
        return recoveredAddress.toLowerCase() === publicAddress.toLowerCase();
    }
    catch (error) {
        console.error(error);
    }
    return false;
}
exports.recoverEthereumAddressAndCheckMatch = recoverEthereumAddressAndCheckMatch;
/**
 * Determine whether the address is associated with an Unstoppable Domain.
 * @param address - email address (with domain)
 * @returns whether address is UD
 */
function isUDAddress(address) {
    const [alias, domain] = address.split('@');
    return alias.endsWith(constants_1.UNSTOPPABLE_ALIAS_SUFFIX) || domain === constants_1.UNSTOPPABLE_CUSTOM_DOMAIN;
}
exports.isUDAddress = isUDAddress;
function isBonfidaName(name) {
    return name.endsWith(walletUtils_constants_1.BONFIDA_SUFFIX) && name.length > walletUtils_constants_1.BONFIDA_SUFFIX.length;
}
exports.isBonfidaName = isBonfidaName;
function isICNSName(alias) {
    const canonicalAlias = alias.toLowerCase();
    return constants_1.SUPPORTED_ICNS_PREFIXES.some((prefix) => canonicalAlias.endsWith(`.${prefix}`));
}
exports.isICNSName = isICNSName;
//# sourceMappingURL=walletUtils.js.map