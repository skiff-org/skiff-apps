import { useUsersFromEmailAliasQuery } from 'skiff-front-graphql';
import { isSkiffAddress } from 'skiff-utils';

export const useDisplayPictureDataFromAddress = (address: string) => {
  const emailAddress = address ?? undefined;
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
