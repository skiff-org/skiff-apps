import { uniqBy } from 'lodash';
import { AddressObject } from 'skiff-graphql';

import { sanitizeSignature } from './signatureUtils';

export const excludeEmailAliases = (addresses: AddressObject[], emailAliases: string[]) => {
  const filteredAddresses = addresses.filter(({ address }) => !emailAliases.includes(address));
  return uniqBy(filteredAddresses, (addr) => addr.address);
};

// We want to filter out the user from to, unless they're just emailing themselves back and forth
export const filterPopulatedToAddresses = (addresses: AddressObject[], emailAliases: string[]) => {
  const filteredToAddresses = excludeEmailAliases(addresses, emailAliases);
  return filteredToAddresses.length ? filteredToAddresses : uniqBy(addresses, (addr) => addr.address);
};

export const getMailFooter = (signature?: string, securedBySkiffSigDisabled?: boolean) => {
  // User signature HTML
  const signatureHtml = !!signature ? sanitizeSignature(signature) : '';
  // Secured by HTML
  const securedByHtml =
    '<p>Secured by <a target="_blank" rel="noopener noreferrer nofollow" href="https://skiff.com/mail">Skiff Mail</a>.</p>';
  return `<p></p><p></p>${signatureHtml}${securedBySkiffSigDisabled ? '' : securedByHtml}`;
};
