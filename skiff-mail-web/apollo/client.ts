import { ApolloClient, ApolloLink, InMemoryCache, NextLink, Operation, from } from '@apollo/client';
import { RetryLink } from '@apollo/client/link/retry';
import { createUploadLink } from 'apollo-upload-client';
import fetch from 'cross-fetch';
import {
  cloudflareChallengeRedirectLink,
  getLatestUserID,
  getCurrentUserData,
  userTypePolicy,
  documentTypePolicy,
  permissionEntryTypePolicy,
  documentCollaboratorTypePolicy,
  teamTypePolicy,
  orgTypePolicy
} from 'skiff-front-utils';
import { SKIFF_USERID_HEADER_NAME } from 'skiff-utils';

import { parseAsMemoizedDate } from './date';
import { attachmentTypePolicy } from './typePolicies/Attachment';
import { emailTypePolicy } from './typePolicies/Email';
import { mailboxFieldPolicy } from './typePolicies/Mailbox';
import { userThreadFieldPolicy } from './typePolicies/UserThread';

export const getRouterUri = () => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  const { origin } = window.location;
  if (origin === 'https://app.skiff.com') {
    return 'https://api.skiff.com';
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

  return process.env.NEXT_PUBLIC_API_BASE_URL;
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
    Attachment: attachmentTypePolicy,
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

const client = new ApolloClient({
  link: from([authLink, retryLink, cloudflareChallengeRedirectLink, link]),
  cache,
  name: 'skiff-mail-web',
  version: process.env.NEXT_PUBLIC_GIT_HASH
});

export default client;
