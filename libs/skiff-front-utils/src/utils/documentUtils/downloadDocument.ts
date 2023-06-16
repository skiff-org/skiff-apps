import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { GetDocumentFullDocument, GetDocumentFullQuery, GetDocumentFullQueryVariables } from 'skiff-front-graphql';

/**
 * Downloads, decrypts, and stores a document with optional slicing parameters.
 * @param {string} docID - The docID of the document to be downloaded.
 * @param {boolean} [forceDownload] - Force network call to server to get last version of the document
 * @returns {Promise<Document>} The document
 */
export async function downloadDocument(
  client: ApolloClient<NormalizedCacheObject>,
  docID: string,
  forceNetwork = false
) {
  const response = await client.query<GetDocumentFullQuery, GetDocumentFullQueryVariables>({
    query: GetDocumentFullDocument,
    variables: {
      request: {
        docID
      }
    },
    fetchPolicy: forceNetwork ? 'network-only' : 'cache-first'
  });
  return response?.data?.document;
}
