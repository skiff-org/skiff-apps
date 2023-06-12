/**
 * Check if supplied string is a valid ENS name
 * @param ensName
 * @returns true if the given ensName ends with .eth
 */
export function isENSName(ensName: string | undefined): boolean {
  if (!ensName) return false;
  return ensName.endsWith('.eth');
}
