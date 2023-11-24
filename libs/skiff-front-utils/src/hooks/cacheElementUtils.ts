import axios, { AxiosRequestConfig } from 'axios';
import memoize from 'lodash/memoize';
import { rawDecryptSymmetric } from 'skiff-crypto';
import { RawRichTextMediaCacheDatagram } from 'skiff-front-graphql';

import { InlineCacheElemData } from '../types';

export const getCacheElementArray = memoize(
  async (cacheElemDataString: string, updateProgress?: (progress: number) => void) => {
    if (!cacheElemDataString) {
      throw new Error('cacheElemDataString undefined');
    }
    const cacheElemData = JSON.parse(cacheElemDataString) as InlineCacheElemData;
    const { url, cacheDataKey } = cacheElemData;
    if (!url || !cacheDataKey) {
      throw new Error('url or cache data key undefined');
    }

    const config: AxiosRequestConfig = {
      onDownloadProgress: (progressEvent: { loaded: number; total: number }) => {
        if (updateProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          updateProgress(percentCompleted);
        }
      },
      responseType: 'arraybuffer'
    };
    const downloadResponse = await axios.get(url, config);
    const textData = (await downloadResponse.data) as ArrayBuffer;
    const decryptedRawCacheData = rawDecryptSymmetric(
      new Uint8Array(textData),
      cacheDataKey,
      RawRichTextMediaCacheDatagram
    );
    return decryptedRawCacheData;
  },
  (cacheElemDataString) => cacheElemDataString
); // memoize only with the cacheElemDataString and not by checking that the updateProgress function is the same
