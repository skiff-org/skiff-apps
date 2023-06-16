import { bytesToHumanReadable, mbToBytes } from 'skiff-utils';
/**
 * Formats a storage amount into a nice form,
 * e.g. 12,000 MB becomes 12 GB
 * @param storageInMegabytes - storage to format, in MB
 * @returns formatted string
 */
export function getFormattedStorage(storageInMegabytes: number) {
  return bytesToHumanReadable(mbToBytes(storageInMegabytes), 0);
}

/**
 * Formats a quantifier clearer -- converts 0 to 'none'
 * @param quantity - quantity to format
 * @returns formatted quantifier
 */
export function getFormattedQuantifier(quantity: number) {
  if (quantity === 0) {
    return 'none';
  }
  return quantity;
}
