import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  DocumentBaseFragment,
  GetDocumentBaseDocument,
  GetDocumentBaseQuery,
  GetDocumentBaseQueryVariables,
  useGetDocumentBaseQuery,
  useGetDocumentFullQuery
} from 'skiff-front-graphql';

import { getDocumentBaseFromCache, getDocumentFromCache } from '../utils/cacheUtils';

/**
 * Get a document from cache or from the API if absent in cache.
 *
 * Try to use a more specific request (useDocumentWithoutContent, or a direct
 * query like useGetCollaboratorsQuery) if you do not need the actual document content.
 * This hook will trigger a sync rerender on every document save; too many such
 * hooks will make block the main thread for a noticeable amount of time during saving.
 */
export const useDocument = (docID: string | false | undefined | null, client: ApolloClient<NormalizedCacheObject>) => {
  const cachedDocumentInfo = docID ? getDocumentFromCache(docID, client) : null;
  // pass false to skip query
  const res = useGetDocumentFullQuery({
    variables: {
      request: {
        docID: docID || ''
      }
    },
    skip: !docID || !!cachedDocumentInfo
  });

  return {
    ...res,
    data: {
      ...res.data,
      document: cachedDocumentInfo || res.data?.document
    }
  };
};

/**
 * Get a document without its content from cache or from the API if absent in cache
 *  */
export const getDocumentWithoutContent = async (
  docID: string | false | null | undefined,
  client: ApolloClient<NormalizedCacheObject>
): Promise<DocumentBaseFragment | undefined> => {
  if (!docID) {
    return undefined;
  }

  // First check to see if document has been cached
  const cachedDocumentInfo = docID ? getDocumentBaseFromCache(docID, client) : null;

  if (cachedDocumentInfo) {
    return cachedDocumentInfo;
  }

  const res = await client.query<GetDocumentBaseQuery, GetDocumentBaseQueryVariables>({
    query: GetDocumentBaseDocument,
    variables: {
      request: {
        docID: docID
      }
    }
  });

  return res.data.document;
};

/**
 * Get a document without its content from cache or from the API if absent in cache
 *
 * TODO (eventually): Remove the hook since we're taking in client, and just use the function above
 */
export const useDocumentWithoutContent = (
  docID: string | false | null | undefined,
  client: ApolloClient<NormalizedCacheObject>
) => {
  // First check to see if document has been cached
  const cachedDocumentInfo = docID ? getDocumentBaseFromCache(docID, client) : null;

  // pass false to skip query
  const res = useGetDocumentBaseQuery({
    variables: {
      request: {
        docID: docID || ''
      }
    },
    skip: !docID || !!cachedDocumentInfo
  });

  return {
    ...res,
    data: {
      ...res.data,
      document: cachedDocumentInfo || res.data?.document
    }
  };
};
