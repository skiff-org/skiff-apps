import { AddressObject } from 'skiff-graphql';
import { useUsersFromEmailAliasQuery } from 'skiff-mail-graphql';

import { isSkiffAddress } from '../utils/userUtils';

export const useDisplayPictureDataFromAddress = (address: string | AddressObject | undefined) => {
  const emailAddress = address ? (typeof address === 'string' ? address : address.address) : undefined;
  // Only Skiff addresses will have profile pictures
  const skipQuery = !emailAddress || !isSkiffAddress(emailAddress, []);
  const { data, error } = useUsersFromEmailAliasQuery({
    variables: {
      emailAliases: emailAddress ? [emailAddress] : []
    },
    skip: skipQuery
  });

  if (skipQuery || error || !data?.usersFromEmailAlias.length) {
    return undefined;
  }

  return data.usersFromEmailAlias[0]?.publicData.displayPictureData;
};
