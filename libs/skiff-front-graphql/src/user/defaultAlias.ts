import { SKIFF_USERID_HEADER_NAME } from 'skiff-utils';

import {
  GetCurrentUserEmailAliasesQuery,
  GetCurrentUserEmailAliasesQueryVariables,
  GetCurrentUserEmailAliasesDocument
} from '../graphql';

import { createAliasClientGivenID } from './profileData';

/**
 * Returns email aliases for a given userID. This data can only be fetched by the currently
 * logged in user. In order to fetch data for all logged in accounts (even if not current),
 * we apply the userID to the header in the cookie/request via context.
 * @param {string} routerURI router URI
 * @param {UserID} userID userID to fetch aliases for
 * @returns {Promise<{string, Array<string>}>} returns object containing userID and emailAliases for the userID
 */
export const getAliasesForUser = async (routerURI: string, userID: string) => {
  try {
    const client = createAliasClientGivenID(routerURI, userID);
    const res = await client.query<GetCurrentUserEmailAliasesQuery, GetCurrentUserEmailAliasesQueryVariables>({
      query: GetCurrentUserEmailAliasesDocument,
      context: {
        headers: {
          [SKIFF_USERID_HEADER_NAME]: userID
        }
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    });
    const aliases = res.data.currentUser?.emailAliases;
    return aliases;
  } catch (error) {
    console.error(error);
    return undefined;
  }
};
