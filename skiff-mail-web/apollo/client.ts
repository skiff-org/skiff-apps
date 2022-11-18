import { ApolloClient, ApolloLink, InMemoryCache, NextLink, Operation, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { createUploadLink } from 'apollo-upload-client';
import fetch from 'cross-fetch';
import { setupDatadog, datadogOnError, getLatestUserID, isDatadogRUMEnabled } from 'skiff-front-utils';
import { SKIFF_USERID_HEADER_NAME } from 'skiff-utils';

import { getCurrentUserData } from './currentUser';
import { parseAsMemoizedDate } from './date';
import { attachmentTypePolicy } from './typePolicies/Attachment';
import { emailTypePolicy } from './typePolicies/Email';
import { mailboxFieldPolicy } from './typePolicies/Mailbox';
import { userThreadFieldPolicy } from './typePolicies/UserThread';

const uri = (getRouterUri() || 'http://localhost:4000') + '/graphql';
const cache = new InMemoryCache({
  typePolicies: {
    UserThread: { keyFields: ['threadID'], fields: { emailsUpdatedAt: { read: parseAsMemoizedDate } } },
    User: { keyFields: ['userID'] },
    Email: emailTypePolicy,
    Attachment: attachmentTypePolicy,
    Query: {
      fields: {
        mailbox: mailboxFieldPolicy,
        userThread: userThreadFieldPolicy
      }
    }
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
let link = createUploadLink({
  uri,
  fetch,
  credentials: 'include'
}) as unknown as ApolloLink;

// Browser only
if (!(typeof window === 'undefined') && isDatadogRUMEnabled()) {
  void setupDatadog();
  const gqleh = onError((errorResponse) => {
    void datadogOnError(errorResponse);
  });

  link = gqleh.concat(link);
}

const client = new ApolloClient({
  link: from([authLink, link]),
  cache,
  name: 'skemail-web',
  version: process.env.NEXT_PUBLIC_GIT_HASH
});

export default client;
