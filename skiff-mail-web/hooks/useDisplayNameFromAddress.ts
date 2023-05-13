import { useGetContactWithEmailAddress } from 'skiff-front-utils';
import { AddressObject } from 'skiff-graphql';
import client from '../apollo/client';

export const useDisplayNameFromAddress = (address: string | AddressObject | undefined) => {
  const emailAddress = address ? (typeof address === 'string' ? address : address.address) : undefined;
  const contact = useGetContactWithEmailAddress({ emailAddress, client });
  // combine first name and last name into single display name
  if (!!contact?.firstName && !!contact?.lastName) {
    return `${contact?.firstName} ${contact?.lastName}`;
  }
  return contact?.firstName ?? contact?.lastName;
};
