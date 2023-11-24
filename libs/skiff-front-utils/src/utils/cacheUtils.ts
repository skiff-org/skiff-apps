import { ApolloCache, ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  ContactDataFragment,
  CurrentUserEmailAliasesDocument,
  CurrentUserEmailAliasesQuery,
  DocumentBaseFragment,
  DocumentBaseFragmentDoc,
  DocumentFullInfoFragment,
  DocumentFullInfoFragmentDoc,
  GetContactsDocument,
  GetContactsQuery,
  GetContactsQueryVariables,
  GetDocumentsBaseDocument,
  GetDocumentsBaseQuery,
  GetDocumentsBaseQueryVariables,
  GetDocumentsRequest,
  ProductApp
} from 'skiff-front-graphql';
import { PermissionLevel } from 'skiff-graphql';

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

  const cachedData = client.cache.readQuery<GetContactsQuery, GetContactsQueryVariables>({
    query: GetContactsDocument,
    variables: { request: { emailAddresses: [emailAddress] } }
  });

  // Extract the contact data from the query result.
  const cachedContacts = cachedData?.contacts;
  const cachedContact = cachedContacts ? cachedContacts[0] : null;

  return cachedContact;
};

/**
 * Add a single document in the cached documents list. This is used when downloading a new single document (when receiving a sharing notification for example)
 * Downloading the single document and then adding it manually to the cached list save another query to the server (GetDocumentsWithoutContents)
 * This can be added in either the personalRootDocuments collection (when doc doesn't have a parent) or in "query by parentID" collection (if doc has a parent)
 * @param {Partial<Document>} doc document to add in the document list
 */
export const addDocumentInDocumentsList = (
  client: ApolloClient<NormalizedCacheObject>,
  doc: GetDocumentsBaseQuery['documents'][0],
  activeProductApp: ProductApp,
  request?: GetDocumentsRequest
) => {
  let collectionRequest = {
    activeProductApp
  } as GetDocumentsRequest;

  if (request) {
    collectionRequest = { ...request, activeProductApp };
  } else {
    if (doc.parentID) {
      collectionRequest.parentID = doc.parentID;
    } else if (doc.currentUserPermissionLevel !== PermissionLevel.Admin) {
      collectionRequest.sharedOnRootDocuments = true;
    } else {
      collectionRequest.personalRootDocuments = true;
    }
  }

  const existingDocuments = client.cache.readQuery<GetDocumentsBaseQuery, GetDocumentsBaseQueryVariables>({
    query: GetDocumentsBaseDocument,
    variables: { request: collectionRequest }
  });

  if (!existingDocuments || existingDocuments?.documents?.some((existingDoc) => existingDoc.docID === doc.docID)) {
    // client didn't request list of documents or document is already in collection
    // nothing to do
    return;
  }

  client.cache.writeQuery<GetDocumentsBaseQuery, GetDocumentsBaseQueryVariables>({
    query: GetDocumentsBaseDocument,
    variables: { request: collectionRequest },
    data: {
      documents: [
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ...existingDocuments.documents,
        doc
      ]
    }
  });
};
