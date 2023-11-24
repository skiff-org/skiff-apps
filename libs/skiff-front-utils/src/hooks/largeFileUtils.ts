import { GenericDocument } from '../types';

import { getCacheElementArray } from './cacheElementUtils';

/**
 * For legacy files (which only have one slice), the slice data is stored in the documentData field.
 *
 * This helper is used to ensure we consistently access the correct data for both legacy and new files.
 * @param doc Decrypted document chunk metadata.
 * @returns Array of slices for the document.
 */
export function getSlices(doc: GenericDocument) {
  return doc.cacheSlices || [doc.documentData];
}

export const downloadSlices = async function* (
  slices: string[],
  updateProgress?: (progress: number) => void,
  concurrency = 5
) {
  let offset = 0;
  const sliceProgress = new Array<number>(slices.length).fill(0);

  const updateOverallProgress = (): void => {
    if (updateProgress) {
      const totalProgress = sliceProgress.reduce((acc, progress) => acc + progress, 0);
      updateProgress((totalProgress / slices.length) * 100);
    }
  };

  const downloadSlice = async (sliceData: string, index: number): Promise<ArrayBuffer> => {
    // Check if the slice is already cached
    if (getCacheElementArray.cache.has(sliceData)) {
      const progressCurrentChunk = 1 / slices.length;
      sliceProgress[index] = progressCurrentChunk;
      updateOverallProgress();
      return getCacheElementArray.cache.get(sliceData) as Uint8Array;
    }

    const slice = await getCacheElementArray(sliceData, (progress: number) => {
      sliceProgress[index] = progress / 100;
      updateOverallProgress();
    });
    return slice;
  };

  for (let i = 0; i < slices.length; i += concurrency) {
    const sliceChunk = slices.slice(i, i + concurrency);
    const sliceChunkIndexes = Array.from({ length: sliceChunk.length }, (_, k) => i + k);

    const downloadedSlices = await Promise.all(
      sliceChunk.map((slice, index) => downloadSlice(slice, sliceChunkIndexes[index]))
    );

    for (const slice of downloadedSlices) {
      yield { slice, offset };
      offset += slice.byteLength;
    }
  }
};

/**
 * Read a whole file into memory. Eventually, this should be unused, but it's a stop gap to support legacy code for now.
 */
export async function getFullFile(
  document: GenericDocument,
  mimeType: string | null | undefined,
  updateProgress?: (progress: number) => void
) {
  const documentData = getSlices(document);
  const slices: ArrayBuffer[] = [];
  for await (const { slice } of downloadSlices(documentData, updateProgress)) {
    slices.push(slice);
  }

  // Combine all ArrayBuffers into one Uint8Array
  const combinedLength = slices.reduce((acc, val) => acc + val.byteLength, 0);
  const file = new Uint8Array(combinedLength);
  let offset = 0;
  for (const slice of slices) {
    file.set(new Uint8Array(slice), offset);
    offset += slice.byteLength;
  }

  // Create and return a Blob
  if (mimeType) {
    return new Blob([file], { type: mimeType });
  }
  return new Blob([file]);
}
