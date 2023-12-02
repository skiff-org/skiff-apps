import { ApolloClient, ApolloLink, InMemoryCache, NextLink, Operation, from, split } from '@apollo/client';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { RetryLink } from '@apollo/client/link/retry';
import { getMainDefinition } from '@apollo/client/utilities';
import { createUploadLink } from 'apollo-upload-client';
import fetch from 'cross-fetch';
import {
  aliasTypePolicy,
  cloudflareChallengeRedirectLink,
  contactTypePolicy,
  documentCollaboratorTypePolicy,
  documentTypePolicy,
  getCurrentUserData,
  getLatestUserID,
  orgTypePolicy,
  permissionEntryTypePolicy,
  teamTypePolicy,
  userTypePolicy
} from 'skiff-front-utils';
import { SKIFF_USERID_HEADER_NAME } from 'skiff-utils';

import { parseAsMemoizedDate } from './date';
import { attachmentTypePolicy } from './typePolicies/Attachment';
import { emailTypePolicy } from './typePolicies/Email';
import { mailboxFieldPolicy } from './typePolicies/Mailbox';
import { userThreadFieldPolicy } from './typePolicies/UserThread';

const DEFAULT_SKEMAIL_API_BASE_URL = 'https://api.skiff.town';

export const getRouterUri = () => {
  if (typeof window === 'undefined') {
    return process.env.SKEMAIL_API_BASE_URL;
  }
  const { origin } = window.location;
  if (origin === 'https://app.skiff.com') {
    return 'https://api.skiff.com';
  }

  if (origin === 'https://app.skiff.city') {
    return 'https://api.skiff.city';
  }

  if (origin === 'https://app.skiff.town') {
    return 'https://api.skiff.town';
  }

  if (origin === 'https://app.skiff.org') {
    return 'https://betaapi.skiff.org';
  }

  if (origin === 'https://staging.skiff.org') {
    return 'https://api.staging.skiff.org';
  }

  if (origin === 'http://localhost:1212') {
    return 'http://localhost:4000';
  }

  return process.env.SKEMAIL_API_BASE_URL || DEFAULT_SKEMAIL_API_BASE_URL;
};

const uri = (getRouterUri() || 'http://localhost:4000') + '/graphql';
const cache = new InMemoryCache({
  typePolicies: {
    UserThread: {
      keyFields: ['threadID'],
      fields: { emailsUpdatedAt: { read: parseAsMemoizedDate }, sentLabelUpdatedAt: { read: parseAsMemoizedDate } }
    },
    User: userTypePolicy,
    Email: emailTypePolicy,
    Contact: contactTypePolicy,
    Attachment: attachmentTypePolicy,
    FullAliasInfo: aliasTypePolicy,
    Query: {
      fields: {
        mailbox: mailboxFieldPolicy,
        userThread: userThreadFieldPolicy
      }
    },
    Document: documentTypePolicy,
    PermissionEntry: permissionEntryTypePolicy,
    DocumentCollaborator: documentCollaboratorTypePolicy,
    Team: teamTypePolicy,
    Organization: orgTypePolicy
  }
});

// auth link to dynamically populate the needed userID header inside the network requests
const authLink = new ApolloLink((operation: Operation, nextLink: NextLink) => {
  const curUserID = getCurrentUserData()?.userID ?? getLatestUserID();
  const initialHeaders = curUserID
    ? {
        [SKIFF_USERID_HEADER_NAME]: curUserID
      }
    : {};
  operation.setContext({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

const retryLink = new RetryLink();

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
    return definition.kind === 'OperationDefinition' && definition.operation === 'mutation';
  },
  link, // if the condition is true, it will use this
  batchHttpLink // if the condition is false, it will use this
);

const client = new ApolloClient({
  link: from([authLink, retryLink, cloudflareChallengeRedirectLink, splitLink]),
  cache,
  name: 'skemail-web',
  version: process.env.GIT_HASH
});

export default client;
