"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSkiffAddress = exports.getMailDomain = exports.isReservedCustomDomain = exports.EXAMPLE_CUSTOM_DOMAIN = exports.sanitizeDomain = exports.validateDomain = exports.domainRegex = void 0;
exports.domainRegex = /^[a-z0-9]+([-.][a-z0-9]+)*\.[a-z]{2,}$/i;
// domains may consist of letters, numbers, periods and hyphens (except for opening or closing ones)
const illegalDomainCharacterRegex = /[^a-z0-9\-.]|^[-.]+|[-.]+$/gi;
// consecutive hyphens or periods not allowed
const consecutivePeriodRegex = /\.[-.]+/g;
const consecutiveHyphenRegex = /-[-.]+/g;
function validateDomain(domain) {
    if (!exports.domainRegex.test(domain)) {
        throw new Error(`Invalid domain ${domain}`);
    }
}
exports.validateDomain = validateDomain;
function sanitizeDomain(domain) {
    let strippedDomain = domain.replaceAll(illegalDomainCharacterRegex, '');
    strippedDomain = strippedDomain.replaceAll(consecutivePeriodRegex, '.');
    return strippedDomain.replaceAll(consecutiveHyphenRegex, '-');
}
exports.sanitizeDomain = sanitizeDomain;
exports.EXAMPLE_CUSTOM_DOMAIN = 'brandeis.com';
const RESERVED_CUSTOM_DOMAINS = ['ethereum.email', 'solana.email', 'keplr.xyz', 'bitkeep.app', 'ud.me'];
/**
 * Return whether the domain is included within our list of reserved
 * Skiff domains, e.g. ethereum.email, keplr.xyz, solana.email, etc.
 * @param domain the email domain to check
 */
const isReservedCustomDomain = (domain) => {
    return RESERVED_CUSTOM_DOMAINS.includes(domain);
};
exports.isReservedCustomDomain = isReservedCustomDomain;
const getMailDomain = () => {
    if (typeof window === 'undefined') {
        if (['local', 'test', 'development'].includes(process.env.NODE_ENV || '')) {
            return 'skiff.town';
        }
        if (process.env.NODE_ENV === 'staging') {
            return 'skiff.city';
        }
        return 'skiff.com';
    }
    if (window.location.hostname.includes('vercel.app')) {
        return 'skiff.town';
    }
    if (window.location.hostname === 'localhost') {
        return 'skiff.town';
    }
    if (window.location.origin === 'https://app.skiff.town') {
        return 'skiff.town';
    }
    if (window.location.origin === 'https://app.skiff.city') {
        return 'skiff.city';
    }
    // .com and .org
    return 'skiff.com';
};
exports.getMailDomain = getMailDomain;
// compare against domain for mail sending
const isSkiffAddress = (address, customDomains) => {
    const domain = address.slice(address.lastIndexOf('@') + 1);
    if (domain !== (0, exports.getMailDomain)() && !(0, exports.isReservedCustomDomain)(domain)) {
        if (customDomains) {
            return customDomains.includes(domain);
        }
        return false;
    }
    return true;
};
exports.isSkiffAddress = isSkiffAddress;
//# sourceMappingURL=customDomainUtils.js.map