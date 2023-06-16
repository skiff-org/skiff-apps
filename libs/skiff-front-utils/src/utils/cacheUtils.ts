import { ApolloCache, ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  ContactDataFragment,
  ContactDataFragmentDoc,
  CurrentUserEmailAliasesDocument,
  CurrentUserEmailAliasesQuery,
  DocumentBaseFragment,
  DocumentBaseFragmentDoc,
  DocumentFullInfoFragment,
  DocumentFullInfoFragmentDoc
} from 'skiff-front-graphql';

/**
 * Updates the stored email aliases for the current user in the cache
 */
export const updateEmailAliases = (cache: ApolloCache<any>, userID: string, emailAliases: string[]) => {
  cache.updateQuery<CurrentUserEmailAliasesQuery>({ query: CurrentUserEmailAliasesDocument }, (existingCache) => {
    if (!existingCache || !existingCache.currentUser) {
      return {
        currentUser: {
          userID,
          emailAliases
        }
      };
    }
    const { currentUser } = existingCache;
    return {
      ...existingCache,
      currentUser: {
        ...currentUser,
        emailAliases
      }
    };
  });
};

export const getDocumentFromCache = (
  docID: string,
  client: ApolloClient<NormalizedCacheObject>
): DocumentFullInfoFragment | null => {
  if (!client.cache) {
    // this is hit during tests
    return null;
  }
  const cacheID = client.cache.identify({ __typename: 'Document', docID }) ?? '';
  const cachedDoc = client.cache.readFragment<DocumentFullInfoFragment>({
    id: cacheID,
    fragment: DocumentFullInfoFragmentDoc,
    fragmentName: 'DocumentFullInfo'
  });

  if (!docID) {
    console.warn(`Could not find document with id ${docID} in cache`);
  }

  return cachedDoc;
};

/**
 * Cached version of a Document that includes all data from the GetDocuments query
 *
 * This can be used to avoid having to make an additional query to fetch a single document,
 * if it has already been fetched as part of a GetDocuments query
 */
export const getDocumentBaseFromCache = (
  docID: string,
  client: ApolloClient<NormalizedCacheObject>
): DocumentBaseFragment | null => {
  if (!client.cache) {
    // this is hit during tests
    return null;
  }
  const cacheID = client.cache.identify({ __typename: 'Document', docID }) ?? '';
  const cachedDoc = client.cache.readFragment<DocumentBaseFragment>({
    id: cacheID,
    fragment: DocumentBaseFragmentDoc,
    fragmentName: 'DocumentBase'
  });

  if (!docID) {
    console.warn(`Could not find document with id ${docID} in cache`);
  }

  return cachedDoc;
};

/**
 * Cached version of a Contact
 *
 * This can be used to avoid having to make an additional query to fetch a single contact,
 * if it has already been fetched as part of a GetAllContacts query
 */
export const getContactDataFromCache = (
  emailAddress: string,
  client: ApolloClient<NormalizedCacheObject>
): ContactDataFragment | null => {
  if (!client.cache) {
    // this is hit during tests
    return null;
  }
  const cacheID = client.cache.identify({ __typename: 'Contact', emailAddress }) ?? '';
  const cachedContact = client.cache.readFragment<ContactDataFragment>({
    id: cacheID,
    fragment: ContactDataFragmentDoc,
    fragmentName: 'ContactData'
  });

  if (!emailAddress) {
    console.warn(`Could not find conatact with address ${emailAddress} in cache`);
  }

  return cachedContact;
};
