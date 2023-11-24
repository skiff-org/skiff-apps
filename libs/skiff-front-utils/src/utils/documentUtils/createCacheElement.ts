import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import axios, { AxiosRequestConfig } from 'axios';
import { generateSymmetricKey, rawEncryptSymmetric } from 'skiff-crypto';
import {
  ConfirmCacheUploadDocument,
  ConfirmCacheUploadMutation,
  ConfirmCacheUploadMutationVariables,
  CreateCacheElementDocument,
  CreateCacheElementMutation,
  CreateCacheElementMutationVariables,
  RawRichTextMediaCacheDatagram
} from 'skiff-front-graphql';
import { getPaywallErrorCode } from 'skiff-graphql';
import { assertExists, PaywallErrorCode } from 'skiff-utils';

import { InlineCacheElemData } from '../../types';

// Timeout for uploading a single block.
export const BLOCK_UPLOAD_TIMEOUT_MS = 1000 * 60 * 5; // 5 minutes

/**
 * Given a src string, get a cache URL for a given piece of data.
 * @param {DocID} docID - Document ID.
 * @param {string} cacheData - Plaintext data needed to add to cache.
 * @returns {string} Stringified cache data object, which is of type InlineCacheElemData.
 */
export async function createCacheElement(
  client: ApolloClient<NormalizedCacheObject>,
  docID: string,
  cacheData: ArrayBuffer,
  type: string,
  openPaywallWithError: (paywallErrorCode: PaywallErrorCode) => void = () => undefined,
  confirmElement = true,
  onUploadProgress?: (progress: any) => void,
  controller?: AbortController
) {
  const dataSize = cacheData.byteLength;
  const cacheDataKey = generateSymmetricKey();
  const response = await client.mutate<CreateCacheElementMutation, CreateCacheElementMutationVariables>({
    mutation: CreateCacheElementDocument,
    variables: {
      request: {
        docID,
        dataSize,
        type
      }
    },
    errorPolicy: 'all'
  });
  const { data, errors } = response;
  if (!data?.createCacheElement || (errors && !!errors.length)) {
    if (errors && !!errors.length) {
      const paywallErrorCode = getPaywallErrorCode(errors);
      if (paywallErrorCode) {
        openPaywallWithError(paywallErrorCode);
        throw errors[0];
      }
    }
    throw new Error('Cache request failed');
  }
  const { writeUrl, cacheID } = data.createCacheElement;
  assertExists(writeUrl, 'writeUrl not found');
  assertExists(cacheID, 'cacheID not found');
  const encryptedBodyData = rawEncryptSymmetric(new Uint8Array(cacheData), cacheDataKey, RawRichTextMediaCacheDatagram);
  const config: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'application/octet-stream',
      'x-amz-acl': 'public-read',
      'Cache-Control': 'max-age=365000000,immutable'
    },
    signal: controller?.signal,
    onUploadProgress,
    timeout: BLOCK_UPLOAD_TIMEOUT_MS
  };
  const uploadResponse = await axios.put(writeUrl, encryptedBodyData, config);
  const uploadResponseStatus = uploadResponse.status;
  if (uploadResponseStatus !== 200) {
    throw new Error('Cache upload failed');
  }
  // whether to confirm the cache element
  if (confirmElement) {
    const confirmResponse = await client.mutate<ConfirmCacheUploadMutation, ConfirmCacheUploadMutationVariables>({
      mutation: ConfirmCacheUploadDocument,
      variables: {
        request: {
          cacheID
        }
      },
      errorPolicy: 'all'
    });
    if (confirmResponse.errors && confirmResponse.errors.length > 0) {
      throw new Error('Cache confirm request failed');
    }
    assertExists(confirmResponse.data, 'confirmResponse data not found');
    assertExists(confirmResponse.data.confirmCacheUpload.readUrl, 'confirmResponse has no read url');
    const { readUrl } = confirmResponse.data.confirmCacheUpload;
    const cacheElemData: InlineCacheElemData = {
      cacheID,
      cacheDataKey,
      url: readUrl,
      ipfsPath: confirmResponse.data.confirmCacheUpload.ipfsPath || undefined
    };
    return JSON.stringify(cacheElemData);
  } else {
    const readUrl = writeUrl.split('?')[0];
    assertExists(readUrl, 'readUrl not found');
    const cacheElemData: InlineCacheElemData = {
      cacheID,
      cacheDataKey,
      url: readUrl
    };
    return JSON.stringify(cacheElemData);
  }
}
