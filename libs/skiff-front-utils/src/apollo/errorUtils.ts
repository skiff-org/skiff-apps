import { NetworkError } from '@apollo/client/errors';

/**
 * Given an Apollo Client network error, return the HTTP status code, if
 * available.
 *
 * The implementation was adapted from:
 * https://github.com/apollographql/apollo-link/issues/300#issuecomment-518445337
 */
export const getStatusCodeFromApolloNetworkError = (networkError: NonNullable<NetworkError>) =>
  'statusCode' in networkError ? networkError.statusCode : null;
