import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { GetDocumentBaseDocument, GetDocumentBaseQuery, GetDocumentBaseQueryVariables } from 'skiff-front-graphql';

/**
 * Downloads, decrypts, and locally stores a document without its contents
 * field.
 * @param {DocID} docID - The docID of the document to be downloaded.
 * @returns {Promise<Document>} The document, which also stored locally via
 * EditorActions.
 */
export async function downloadDocumentWithoutContent(
  client: ApolloClient<NormalizedCacheObject>,
  docID: string,
  forceNetwork = false
) {
  const response = await client.query<GetDocumentBaseQuery, GetDocumentBaseQueryVariables>({
    query: GetDocumentBaseDocument,
    variables: {
      request: {
        docID
      }
    },
    fetchPolicy: forceNetwork ? 'network-only' : 'cache-first'
  });
  return response?.data?.document;
}
