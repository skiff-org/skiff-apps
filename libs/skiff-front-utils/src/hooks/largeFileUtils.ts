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

// Generator that downloads slices of the file
export const downloadSlices = async function* (slices: string[], updateProgress?: (progress: number) => void) {
  let offset = 0;
  for (let i = 0; i < slices.length; i += 1) {
    const sliceData = slices[i];
    const slice = (await getCacheElementArray(sliceData, (progress) => {
      if (updateProgress) {
        // In decimal form.
        const progressBeforeChunk = i / slices.length;
        // "progress" is provided in percent form, so we divide by 100.
        const progressCurrentChunk = (1 / slices.length) * (progress / 100);
        // Overall progress is the sum of the progress before the current chunk and the progress of the current chunk.
        const overallProgress = progressBeforeChunk + progressCurrentChunk;
        updateProgress(overallProgress * 100);
      }
    })) as any[];
    yield { slice, offset };
    offset += slice.length;
  }
};
/**
 * Read a whole file into memory. Eventually, this should be unused, but it's a stop gap to support legacy code for now.
 */
export async function getFullFile(document: GenericDocument, updateProgress?: (progress: number) => void) {
  const documentData = getSlices(document);
  let file: number[] = [];
  for await (const { slice } of downloadSlices(documentData, updateProgress)) {
    file = file.concat(Array.from(slice));
  }
  return new Blob([new Uint8Array(file)]);
}
