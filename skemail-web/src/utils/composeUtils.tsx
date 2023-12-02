import DOMPurify from 'dompurify';
import isString from 'lodash/isString';
import uniqBy from 'lodash/uniqBy';
import { Avatar, Icon, Size } from 'nightwatch-ui';
import { GetThreadFromIdDocument, GetThreadFromIdQuery } from 'skiff-front-graphql';
import { CircleBadge, UserAvatar, formatEmailAddress } from 'skiff-front-utils';
import { AddressObject } from 'skiff-graphql';
import styled from 'styled-components';

import client from '../apollo/client';

import { sanitizeSignature } from './signatureUtils';

const LoadingAvatar = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 100px;
  background: var(--bg-overlay-tertiary);
`;

export const preprocessAddressesForEncryption = (addresses: AddressObject[]) =>
  uniqBy(
    addresses.map(({ name, address }) => ({ name, address })),
    (addr) => addr.address
  );

export const excludeEmailAliases = (addresses: AddressObject[], emailAliases: string[]) => {
  const lowercasedEmailAliases = emailAliases.map((alias) => alias.toLowerCase());
  const filteredAddresses = addresses.filter(({ address }) => !lowercasedEmailAliases.includes(address.toLowerCase()));
  return uniqBy(filteredAddresses, (addr) => addr.address);
};

// We want to filter out the user from to, unless they're just emailing themselves back and forth
export const filterPopulatedToAddresses = (addresses: AddressObject[], emailAliases: string[]) => {
  const filteredToAddresses = excludeEmailAliases(addresses, emailAliases);
  return filteredToAddresses.length ? filteredToAddresses : uniqBy(addresses, (addr) => addr.address);
};

export const getBadgeIcon = (chipLabel: string, isSkiffInternal?: boolean, destructive?: boolean) => {
  if (destructive) {
    return <Avatar color={destructive ? 'red' : 'green'} icon={Icon.Warning} />;
  }
  if (isSkiffInternal === undefined) {
    return <LoadingAvatar />;
  } else {
    return isSkiffInternal ? (
      <CircleBadge hideContainer color='source' icon={Icon.ShieldEncrypt} size={Size.X_MEDIUM} />
    ) : (
      <UserAvatar label={chipLabel} />
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

export const getMailFooter = (isFromQuickAlias: boolean, signature?: string, securedBySkiffSigDisabled?: boolean) => {
  // User signature HTML
  const signatureHtml = !!signature ? sanitizeSignature(signature, isFromQuickAlias) : '';
  const securedByHtml =
    '<p>Secured by <a target="_blank" rel="noopener noreferrer nofollow" href="https://skiff.com/mail">Skiff Mail</a>.</p>';
  return DOMPurify.sanitize(`<p></p><p></p>${signatureHtml}${securedBySkiffSigDisabled ? '' : securedByHtml}`);
};

export const removeEmailFromOptimisticUpdate = (activeThreadID: string, replyEmailID: string) => {
  // Remove the optimistically inserted email from the cache
  client.cache.updateQuery<GetThreadFromIdQuery>(
    { query: GetThreadFromIdDocument, variables: { threadID: activeThreadID } },
    (existing) => {
      if (!existing || !existing?.userThread) return;
      const existingEmails = existing.userThread.emails;
      return {
        ...existing,
        userThread: {
          ...existing.userThread,
          emails: existingEmails.filter((email) => email.id !== replyEmailID)
        }
      };
    }
  );
};
