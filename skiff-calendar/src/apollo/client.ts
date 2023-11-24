import { ApolloClient, ApolloLink, InMemoryCache, NextLink, Operation, from, split } from '@apollo/client';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { RetryLink } from '@apollo/client/link/retry';
import { getMainDefinition } from '@apollo/client/utilities';
import { createUploadLink } from 'apollo-upload-client';
import fetch from 'cross-fetch';
import {
  cloudflareChallengeRedirectLink,
  getLatestUserID,
  getCurrentUserData,
  documentTypePolicy,
  contactTypePolicy,
  permissionEntryTypePolicy,
  documentCollaboratorTypePolicy,
  teamTypePolicy,
  orgTypePolicy,
  userTypePolicy
} from 'skiff-front-utils';
import { SKIFF_DEVICEID_HEADER_NAME, SKIFF_USERID_HEADER_NAME } from 'skiff-utils';

export const getRouterUri = () => {
  if (typeof window === 'undefined') {
    return process.env.CALENDAR_API_BASE_URL;
  }
  const { origin } = window.location;
  if (origin === 'https://app.skiff.com') {
    return 'https://api.skiff.com';
  }

  if (origin === 'https://app.skiff.town') {
    return 'https://api.skiff.town';
  }

  if (origin === 'https://app.skiff.city') {
    return 'https://api.skiff.city';
  }

  if (origin === 'https://app.skiff.org') {
    return 'https://betaapi.skiff.org';
  }

  if (origin === 'https://staging.skiff.org') {
    return 'https://api.staging.skiff.org';
  }

  return process.env.CALENDAR_API_BASE_URL;
};

const uri = (getRouterUri() || 'http://localhost:4000') + '/graphql';

const cache = new InMemoryCache({
  typePolicies: {
    User: userTypePolicy,
    Document: documentTypePolicy,
    Contact: contactTypePolicy,
    PermissionEntry: permissionEntryTypePolicy,
    DocumentCollaborator: documentCollaboratorTypePolicy,
    Team: teamTypePolicy,
    Organization: orgTypePolicy
  }
});

// auth link to dynamically populate the needed userID header inside the network requests
const authLink = new ApolloLink((operation: Operation, nextLink: NextLink) => {
  const curUserID = getCurrentUserData()?.userID ?? getLatestUserID();
  const initialHeaders: Record<string, string> = {};
  if (curUserID) initialHeaders[SKIFF_USERID_HEADER_NAME] = curUserID;
  if (window.deviceID) initialHeaders[SKIFF_DEVICEID_HEADER_NAME] = window.deviceID;
  operation.setContext({
    headers: {
      ...operation.getContext().headers,
      ...initialHeaders
    }
  });
  return nextLink(operation);
});

// Casted to unknown because `createUploadLink` types don't match.
const link = createUploadLink({
  uri,
  fetch,
  credentials: 'include'
}) as unknown as ApolloLink;

const batchHttpLink = new BatchHttpLink({
  uri,
  credentials: 'include',
  fetch
});

// split function routes requests to the appropriate link
const splitLink = split(
  // Split based on operation type - mutations should use the upload link, which supports file uploads
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      (definition.kind === 'OperationDefinition' && definition.operation === 'mutation') ||
      process.env.NODE_ENV === 'test'
    );
  },
  link, // if the condition is true, it will use this
  batchHttpLink // if the condition is false, it will use this
);

const retryLink = new RetryLink();

const client = new ApolloClient({
  name: 'calendar-web',
  version: process.env.GIT_HASH,
  link: from([
    authLink,
    retryLink,
    cloudflareChallengeRedirectLink,
    splitLink
  ]),
  cache
});

export default client;
