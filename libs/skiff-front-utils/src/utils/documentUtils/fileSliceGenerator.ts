import { FILE_SLICE_SIZE } from 'skiff-utils';

// Maximum number of files that can be uploaded at once.
export const CONCURRENT_UPLOAD_LIMIT = 5;

// Maximum number of blocks that can be uploaded at once for a given file.
export const CONCURRENT_BLOCKS_PER_FILE = 5;

/**
 * Creates a generator to split a file into multiple slices, each of `FILE_SLICE_SIZE` bytes.
 *
 * This is implemented as a generator, and will return one slice in each iteration of the generator
 * up until the end of the file.
 * @param file File to split into slices
 */
export function* fileSliceGenerator(file: File) {
  const fileSize = file.size;
  let offset = 0;
  let index = 0;
  while (offset < fileSize) {
    const slice = file.slice(offset, offset + FILE_SLICE_SIZE);
    yield {
      slice: new Promise<ArrayBuffer>((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsArrayBuffer(slice);
        fileReader.onload = (e) => {
          if (!e.target || e.target.error) {
            return reject(e.target?.error || new Error('Error reading file'));
          }
          if (fileReader.result instanceof ArrayBuffer) {
            resolve(fileReader.result);
          } else {
            reject('FileReader result is not an ArrayBuffer');
          }
        };
      }),
      offset,
      index,
      size: Math.min(FILE_SLICE_SIZE, fileSize - offset)
    };

    offset += FILE_SLICE_SIZE;
    index += 1;
  }
}
