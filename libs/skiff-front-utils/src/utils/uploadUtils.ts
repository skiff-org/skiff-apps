import { sha256 } from './hashUtils';

export async function computeContentHash(contentChunks: string[]) {
  const hashes = await Promise.all(contentChunks.map((content) => sha256(content)));
  return hashes.join('_');
}
