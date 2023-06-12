/* eslint-disable import/prefer-default-export */
import { ApolloError } from '@apollo/client/errors'; // Importing directly from this file to prevent adding the whole @apollo/client lib to this lib
import { GraphQLError } from 'graphql';
import { isPaywallErrorCode, PaywallErrorCode } from 'skiff-utils';

import type { LogicErrorTypes } from './errors';
import { BatchError } from './types';

// https://www.apollographql.com/docs/apollo-server/data/errors/
export const isApolloLogicErrorType = <T extends LogicErrorTypes>(e: any, type: T): e is InstanceType<T> =>
  e?.extensions?.code === type.CODE;

// convert Batch error to GraphQL error to let batch mutation and normal mutation use the same error handling
export const convertBatchError = (e: BatchError) =>
  new ApolloError({
    errorMessage: e.message,
    graphQLErrors: [
      new GraphQLError(e.message, {
        extensions: (typeof e.extensions === 'string' ? JSON.parse(e.extensions) : undefined) || { code: e.code }
      })
    ]
  });

export const getPaywallErrorCode = (errors: readonly GraphQLError[]) => {
  if (!errors.length) return;
  const allErrorCodes = errors.map((error) => (!!error.extensions?.code ? (error.extensions.code as string) : ''));
  const paywallErrorCode = allErrorCodes.find((code) => isPaywallErrorCode(code));
  if (!paywallErrorCode) return;
  return paywallErrorCode as PaywallErrorCode;
};
