export const domainRegex = /^[a-z0-9]+([-.][a-z0-9]+)*\.[a-z]{2,}$/i;

// domains may consist of letters, numbers, periods and hyphens (except for opening or closing ones)
const illegalDomainCharacterRegex = /[^a-z0-9\-.]|^[-.]+|[-.]+$/gi;

// consecutive hyphens or periods not allowed
const consecutivePeriodRegex = /\.[-.]+/g;
const consecutiveHyphenRegex = /-[-.]+/g;

export function validateDomain(domain: string) {
  if (!domainRegex.test(domain)) {
    throw new Error(`Invalid domain ${domain}`);
  }
}

export function sanitizeDomain(domain: string) {
  let strippedDomain = domain.replaceAll(illegalDomainCharacterRegex, '');
  strippedDomain = strippedDomain.replaceAll(consecutivePeriodRegex, '.');
  return strippedDomain.replaceAll(consecutiveHyphenRegex, '-');
}

export const EXAMPLE_CUSTOM_DOMAIN = 'brandeis.com';

const RESERVED_CUSTOM_DOMAINS = ['ethereum.email', 'solana.email', 'keplr.xyz', 'bitkeep.app', 'ud.me'];

/**
 * Return whether the domain is included within our list of reserved
 * Skiff domains, e.g. ethereum.email, keplr.xyz, solana.email, etc.
 * @param domain the email domain to check
 */
export const isReservedCustomDomain = (domain: string) => {
  return RESERVED_CUSTOM_DOMAINS.includes(domain);
};

export const getMailDomain = () => {
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

// compare against domain for mail sending
export const isSkiffAddress = (address: string, customDomains?: string[]) => {
  const domain = address.slice(address.lastIndexOf('@') + 1);
  if (domain !== getMailDomain() && !isReservedCustomDomain(domain)) {
    if (customDomains) {
      return customDomains.includes(domain);
    }
    return false;
  }
  return true;
};
