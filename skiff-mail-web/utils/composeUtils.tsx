import DOMPurify from 'dompurify';
import isString from 'lodash/isString';
import uniqBy from 'lodash/uniqBy';
import { Avatar, Icon, Size } from 'nightwatch-ui';
import { formatEmailAddress, UserAvatar } from 'skiff-front-utils';
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

export const getBadgeIcon = (chipLabel: string, isSkiffInternal?: boolean, destructive?: boolean) => {
  if (destructive) {
    return <Avatar color={destructive ? 'red' : 'green'} icon={Icon.Warning} rounded size={Size.SMALL} />;
  }
  if (isSkiffInternal === undefined) {
    return <UserAvatar label={chipLabel} rounded size={Size.SMALL} />;
  } else {
    return isSkiffInternal ? (
      <Avatar color='green' icon={Icon.ShieldCheck} rounded size={Size.SMALL} />
    ) : (
      <Avatar disabled icon={Icon.Lock} rounded size={Size.SMALL} />
    );
  }
};

// If one of the new values is a plain string and not an object from the contact list, convert it into the address obj
export const toAddressObjects = (values: Array<string | AddressObject>) =>
  values.reduce((acc, val) => {
    if (isString(val)) {
      const addrs: AddressObject[] = val.split(/\s+/).map((address) => {
        return {
          address: formatEmailAddress(address, false)
        };
      });
      return [...acc, ...addrs];
    } else {
      return [...acc, val];
    }
  }, [] as AddressObject[]);

export const getMailFooter = (signature?: string, securedBySkiffSigDisabled?: boolean) => {
  // User signature HTML
  const signatureHtml = !!signature ? sanitizeSignature(signature) : '';
  // Secured by HTML
  const securedByHtml =
    '<p>Secured by <a target="_blank" rel="noopener noreferrer nofollow" href="https://skiff.com/mail">Skiff Mail</a>.</p>';
  return DOMPurify.sanitize(`<p></p><p></p>${signatureHtml}${securedBySkiffSigDisabled ? '' : securedByHtml}`);
};
