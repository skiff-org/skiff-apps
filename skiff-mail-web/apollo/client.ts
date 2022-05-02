import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { createUploadLink } from 'apollo-upload-client';
import fetch from 'cross-fetch';

import { parseAsMemoizedDate } from './date';
import { attachmentTypePolicy } from './typePolicies/Attachment';
import { emailTypePolicy } from './typePolicies/Email';
import { mailboxFieldPolicy } from './typePolicies/Mailbox';

const uri = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000') + '/graphql';
const cache = new InMemoryCache({
  typePolicies: {
    UserThread: { keyFields: ['threadID'], fields: { emailsUpdatedAt: { read: parseAsMemoizedDate } } },
    User: { keyFields: ['userID'] },
    Email: emailTypePolicy,
    Attachment: attachmentTypePolicy,
    Query: {
      fields: {
        mailbox: mailboxFieldPolicy
      }
    }
  }
});

// Casted to unknown because `createUploadLink` types don't match.
const link = createUploadLink({
  uri,
  fetch,
  credentials: 'include'
}) as unknown as ApolloLink;

const client = new ApolloClient({
  link,
  cache
});

export default client;
