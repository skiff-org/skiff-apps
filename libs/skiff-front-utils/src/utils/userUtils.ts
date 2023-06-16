import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  GetUserIdDocument,
  GetUserIdQuery,
  GetUserIdQueryVariables,
  UsersFromEmailAliasDocument,
  UsersFromEmailAliasQuery,
  UsersFromEmailAliasQueryVariables,
  USER_NOT_FOUND,
  DisplayPictureData
} from 'skiff-front-graphql';
import { AddressObject, User } from 'skiff-graphql';
import {
  isBonfidaName,
  isENSName,
  getMailDomain,
  trimAndLowercase,
  isWalletOrNameServiceAddress,
  isWalletAddress,
  filterExists
} from 'skiff-utils';
import isEmail from 'validator/lib/isEmail';

import { MAIL_DOMAIN } from './getMailDomain';
import {
  abbreviateWalletAddress,
  createAbbreviatedWalletEmail,
  createEmail,
  getEthAddrFromENSName
} from './walletUtils';

// Returns an array with the alias and the domain
// For example, if email were 'test@skiff.com', this would return { alias: 'test', domain: 'skiff.com' }
export const splitEmailToAliasAndDomain = (email: string): { alias: string; domain: string } => {
  // TODO: Figure out why the `email` param is sometimes undefined, which causes
  // `split` to throw.
  try {
    const [alias = '', domain = ''] = email.split('@');
    return { alias, domain };
  } catch (e) {
    console.error(e);

    return { alias: '', domain: '' };
  }
};

/**
 * Return the tooltip label associated with an email address.
 * If it's a wallet address, return the full email. Otherwise return
 * an empty string, which results in the tooltip not being rendered.
 * @param emailAddress the email address to get the tooltip label for
 * @returns the tooltip label
 */
export const getAddressTooltipLabel = (emailAddress: string) => {
  const { alias } = splitEmailToAliasAndDomain(emailAddress);
  return isWalletAddress(alias) ? emailAddress : '';
};

/**
 * Return the tooltip label associated with a displayName/username.
 * If it's a wallet address, return the full name. Otherwise return
 * an empty string, which results in the tooltip not being rendered.
 * @param name the displayName/username to get the tooltip label for
 * @returns the tooltip label
 */
export const getNameTooltipLabel = (name: string) => (isWalletOrNameServiceAddress(name) ? name : '');

/**
 * Formats an email address.
 * If the address is a wallet email address - abbreviate it and add the appropriate email domain at the end.
 * If the address is a ENS address - append appropriate email domain at the end
 * Otherwise, leave the address as is.
 * @param emailAddress the email address to format
 * @returns a formatted email address
 */
export const formatEmailAddress = (emailAddress: string, abbreviate = true) => {
  if (!emailAddress) return '';

  const { alias, domain } = splitEmailToAliasAndDomain(emailAddress);
  if (isEmail(emailAddress)) {
    if (isWalletAddress(alias) && abbreviate) {
      return createAbbreviatedWalletEmail(alias, domain);
    }
    return emailAddress;
  }
  if (isENSName(alias) || isBonfidaName(alias)) {
    return createEmail(alias, getMailDomain());
  }
  if (isWalletOrNameServiceAddress(alias)) {
    return abbreviate ? createAbbreviatedWalletEmail(alias, getMailDomain()) : createEmail(alias, getMailDomain());
  }
  return emailAddress;
};

/**
 * Formats a displayName/username. If it is a wallet address,
 * abbreviate it. Otherwise, leave the displayName/username as is.
 * @param name the displayName/username to format
 * @returns a formatted displayName/username
 */
export const formatName = (name: string | undefined, startChars?: number, endChars?: number) => {
  if (!name) return '';
  // if name is not an email, alias will be equal to name
  const { alias } = splitEmailToAliasAndDomain(name);
  return isWalletAddress(alias) ? abbreviateWalletAddress(alias, startChars, endChars) : name;
};

/**
 * Given an address object, get the formatted and raw display names
 * @param addr the address object to get the display name for
 * @returns the formatted and raw display names of the address object.
 */
export const getAddrDisplayName = (addr: AddressObject) => {
  const { address, name } = addr;
  const formattedDisplayName = name ? formatName(name) : formatEmailAddress(address);
  const displayName = name || address;
  return { displayName, formattedDisplayName };
};

/**
 * Returns the display picture data object given a user
 * if it exists.
 * @param user the User object we want to get the avatar image for.
 */
export const getDisplayPictureDataFromUser = (
  user?: Pick<Partial<User>, 'publicData'> | null
): DisplayPictureData | undefined => {
  return user?.publicData?.displayPictureData ?? undefined;
};

/**
 * Returns the formatted and raw display names given a user
 * @param user the User object we want to get the display name for.
 * we only require either the username or publicData of the user in
 * order to accommodate the different User types
 * @param defaultName the default display name
 * @returns the formatted and raw display names of the user
 */
export const getDisplayNameFromUser = (
  user?: Pick<User, 'username'> | Pick<User, 'publicData'> | null,
  defaultName?: string
) => {
  let displayName = defaultName || USER_NOT_FOUND;
  if (user && 'publicData' in user && user.publicData.displayName) {
    displayName = user.publicData.displayName;
  } else if (user && 'username' in user && user.username) {
    displayName = user.username;
  }
  return {
    displayName,
    formattedDisplayName: formatName(displayName)
  };
};

export const userMatchesSearchQuery = (user: Pick<User, 'username' | 'publicData'>, query: string): boolean => {
  const searchQuery = trimAndLowercase(query);
  if (user.username.toLowerCase().includes(searchQuery)) {
    return true;
  }

  if (user.publicData.displayName && user.publicData.displayName.toLowerCase().includes(searchQuery)) {
    return true;
  }

  return false;
};

/**
 * Fetches userIDs from array of usernames.
 * @param {Array<string>} usernames - Array of usernames.
 * @param {forceNetwork?} forceNetwork - Whether to force network query.
 * @returns Array of userIDs. If the array is empty, this means that the given usernames do not exist.
 */
export async function fetchUserIdsFromUsernames(
  client: ApolloClient<NormalizedCacheObject>,
  usernames: Array<string>,
  forceNetwork = false
): Promise<Array<string>> {
  const allUserIDs = await Promise.all(
    usernames.map(async (username) => {
      // resolve ENS address if needed; will return undefined if not .eth or invalid
      const resolvedAddress = await getEthAddrFromENSName(username);
      const userDataResponse = await client.query<GetUserIdQuery, GetUserIdQueryVariables>({
        query: GetUserIdDocument,
        variables: {
          request: {
            username: resolvedAddress ?? username
          }
        },
        fetchPolicy: forceNetwork ? 'network-only' : 'cache-first'
      });
      return userDataResponse.data.user?.userID;
    })
  );
  return allUserIDs.filter(filterExists);
}

/**
 * Given a possible email alias, fetch a user's username and userID.
 * @returns {{ string, username }} returns object containing userID and username.
 */
export async function getUserInfoFromMailAlias(client: ApolloClient<NormalizedCacheObject>, possibleAlias: string) {
  const emailAliasQueryRes = await client.query<UsersFromEmailAliasQuery, UsersFromEmailAliasQueryVariables>({
    query: UsersFromEmailAliasDocument,
    variables: {
      emailAliases: possibleAlias
    }
  });
  const userAliasRes = emailAliasQueryRes.data?.usersFromEmailAlias;
  if (userAliasRes?.length > 0 && userAliasRes[0]) {
    return { userID: userAliasRes[0].userID, username: userAliasRes[0].username };
  }
  return undefined;
}

export async function lookupAliasInfoFromEmail(client: ApolloClient<NormalizedCacheObject>, email: string) {
  const userInfo = await getUserInfoFromMailAlias(client, email);
  return userInfo;
}
/**
 * Reformat username as email address/alias.
 */
export async function formatUsernameAndCheckExists(
  client: ApolloClient<NormalizedCacheObject>,
  curUsername: string
): Promise<{ formattedUsername: string | undefined; error?: boolean }> {
  const lowerCaseUsername = curUsername.toLowerCase();
  try {
    const checkDirectUsername = await fetchUserIdsFromUsernames(client, [lowerCaseUsername]);
    // If checkDirectUsername is empty, this means that the user does not exist.
    // If the length is defined, this means there is a valid user corresponding to the username.
    if (checkDirectUsername.length) {
      return { formattedUsername: lowerCaseUsername };
    }
  } catch (error) {
    console.error(error);
    // If we error here this means that there is something wrong with our servers.
    // If the user did not exist, checkDirectUsername would instead be an empty array.
    return { formattedUsername: undefined, error: true };
  }
  try {
    const checkWithoutEmail = await lookupAliasInfoFromEmail(client, lowerCaseUsername);
    if (checkWithoutEmail) {
      return { formattedUsername: checkWithoutEmail.username };
    }
    const checkWithEmail = await lookupAliasInfoFromEmail(client, lowerCaseUsername + '@' + MAIL_DOMAIN);
    if (checkWithEmail) {
      return { formattedUsername: checkWithEmail.username };
    }
    return { formattedUsername: undefined };
  } catch (error) {
    console.error(error);
    return { formattedUsername: undefined, error: true };
  }
}
