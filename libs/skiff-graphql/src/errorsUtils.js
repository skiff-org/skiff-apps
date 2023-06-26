"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaywallErrorCode = exports.convertBatchError = exports.isApolloLogicErrorType = void 0;
/* eslint-disable import/prefer-default-export */
const errors_1 = require("@apollo/client/errors"); // Importing directly from this file to prevent adding the whole @apollo/client lib to this lib
const graphql_1 = require("graphql");
const skiff_utils_1 = require("skiff-utils");
// https://www.apollographql.com/docs/apollo-server/data/errors/
const isApolloLogicErrorType = (e, type) => e?.extensions?.code === type.CODE;
exports.isApolloLogicErrorType = isApolloLogicErrorType;
// convert Batch error to GraphQL error to let batch mutation and normal mutation use the same error handling
const convertBatchError = (e) => new errors_1.ApolloError({
    errorMessage: e.message,
    graphQLErrors: [
        new graphql_1.GraphQLError(e.message, {
            extensions: (typeof e.extensions === 'string' ? JSON.parse(e.extensions) : undefined) || { code: e.code }
        })
    ]
});
exports.convertBatchError = convertBatchError;
const getPaywallErrorCode = (errors) => {
    if (!errors.length)
        return;
    const allErrorCodes = errors.map((error) => (!!error.extensions?.code ? error.extensions.code : ''));
    const paywallErrorCode = allErrorCodes.find((code) => (0, skiff_utils_1.isPaywallErrorCode)(code));
    if (!paywallErrorCode)
        return;
    return paywallErrorCode;
};
exports.getPaywallErrorCode = getPaywallErrorCode;
//# sourceMappingURL=errorsUtils.js.map