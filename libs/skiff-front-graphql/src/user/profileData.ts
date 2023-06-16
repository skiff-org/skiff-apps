/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ApolloClient, ApolloLink, InMemoryCache, NextLink, Operation, createHttpLink, from } from '@apollo/client';
import { RetryLink } from '@apollo/client/link/retry';
import { SKIFF_USERID_HEADER_NAME } from 'skiff-utils';

import {
  GetUserProfileOrgDataQuery,
  GetUserProfileOrgDataQueryVariables,
  GetUserProfileOrgDataDocument
} from '../graphql';

// creates an auth link that respects incoming headers above others
const createAliasAuthLink = (userID: string) => {
  const aliasAuthLink = new ApolloLink((operation: Operation, nextLink: NextLink) => {
    const initialHeaders: Record<string, string> = {};
    operation.setContext({
      headers: {
        // inverted
        ...initialHeaders,
        ...operation.getContext().headers,
        [SKIFF_USERID_HEADER_NAME]: userID
      }
    });
    return nextLink(operation);
  });
  return aliasAuthLink;
};

// create an apollo client as a given userID
export const createAliasClientGivenID = (routerURI: string, userID: string) => {
  const curAuthLink = createAliasAuthLink(userID);
  const httpLink = createHttpLink({
    uri: `${routerURI}/graphql`,
    credentials: 'include'
  });
  const retryLink = new RetryLink();
  return new ApolloClient({
    // TODO (CAT-527): Add Cloudflare challenge redirect link. However, that
    // link is in `skiff-front-utils`, so we can't access it in `skiff-front-graphql`.
    // Do we even need this custom "alias" Apollo Client instance?
    link: from([curAuthLink, retryLink, httpLink]),
    name: 'editor-web-alias',
    version: process.env.GIT_HASH,
    cache: new InMemoryCache()
  });
};

/**
 * Fetches public data about user from ID
 * @param {string} routerURI Apollo router URI
 * @param {Array<UserID>} userIDs array of target user IDs
 */
export async function fetchUserProfileOrgDataFromID(routerURI: string, userID: string) {
  const client = createAliasClientGivenID(routerURI, userID);
  const profileDataResponse = await client.query<GetUserProfileOrgDataQuery, GetUserProfileOrgDataQueryVariables>({
    query: GetUserProfileOrgDataDocument,
    variables: {
      request: {
        userID
      }
    },
    context: {
      headers: {
        [SKIFF_USERID_HEADER_NAME]: userID
      }
    },
    fetchPolicy: 'network-only',
    errorPolicy: 'all'
  });

  const { user } = profileDataResponse.data;

  if (!user) {
    console.error('FetchUsersPublicOrgData: Request failed.');
    return null;
  }

  return user;
}
