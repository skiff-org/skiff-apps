import { useMemo } from 'react';
import {
  useGetDefaultProfilePictureQuery,
  useUsersFromEmailAliasQuery,
  useAliasDisplayInfoQuery
} from 'skiff-front-graphql';
import { getContactDisplayPictureData, useGetContactWithEmailAddress } from 'skiff-front-utils';
import { AddressObject } from 'skiff-graphql';
import { isSkiffAddress, VERIFIED_SKIFF_EMAILS } from 'skiff-utils';

import client from '../apollo/client';

export const useDisplayPictureWithDefaultFallback = (
  address: string | AddressObject | undefined,
  messageID?: string
) => {
  const displayPictureDataFromAddress = useDisplayPictureDataFromAddress(address);

  const defaultRes = useGetDefaultProfilePictureQuery({
    variables: { request: { messageID: messageID ?? '' } },
    skip: !messageID,
    fetchPolicy: 'cache-first'
  });

  return useMemo(() => {
    let displayPictureData = displayPictureDataFromAddress ?? {};
    let unverified = false;

    if (defaultRes.data?.defaultProfilePicture?.profilePictureData && !displayPictureDataFromAddress) {
      const emailAddress = address ? (typeof address === 'string' ? address : address.address) : undefined;
      unverified = emailAddress ? !VERIFIED_SKIFF_EMAILS.includes(emailAddress) : true;
      displayPictureData = { profileCustomURI: defaultRes.data.defaultProfilePicture.profilePictureData };
    }

    return { displayPictureData, unverified };
  }, [address, displayPictureDataFromAddress, defaultRes.data]);
};

export const useDisplayPictureDataFromAddress = (address: string | AddressObject | undefined) => {
  const emailAddress = useMemo(
    () => (address ? (typeof address === 'string' ? address : address.address) : undefined),
    [address]
  );
  const skipQuery = useMemo(() => !emailAddress || !isSkiffAddress(emailAddress, []), [emailAddress]);

  const usersFromEmailAliasQuery = useUsersFromEmailAliasQuery({
    variables: { emailAliases: emailAddress ? [emailAddress] : [] },
    skip: skipQuery,
    fetchPolicy: 'cache-first'
  });

  const aliasDisplayInfoQuery = useAliasDisplayInfoQuery({
    variables: { emailAlias: emailAddress ?? '' },
    skip: skipQuery,
    fetchPolicy: 'cache-first'
  });

  const contact = useGetContactWithEmailAddress({ emailAddress, client });

  return useMemo(() => {
    const { data, error } = usersFromEmailAliasQuery;
    const { data: aliasDisplayData } = aliasDisplayInfoQuery;

    const contactDisplayPictureData = contact ? getContactDisplayPictureData(contact) : undefined;

    if (contactDisplayPictureData) {
      return contactDisplayPictureData;
    }

    if (aliasDisplayData?.aliasDisplayInfo?.displayPictureData) {
      return aliasDisplayData.aliasDisplayInfo.displayPictureData;
    }

    if (skipQuery || error || !data?.usersFromEmailAlias.length) {
      return undefined;
    }
    return data.usersFromEmailAlias[0]?.publicData.displayPictureData;
  }, [usersFromEmailAliasQuery, aliasDisplayInfoQuery, skipQuery, contact]);
};
