/**
 * Scale factor to convert from each byte unit to the next
 * e.g. 1000 bytes = 1 kilobyte, 1000 kilobytes = 1 megabyte, etc.
 */
export const BYTE_SCALE_FACTOR = 1000;

/**
 * Upward conversion functions from bytes
 */

export const bytesToKb = (bytes: number) => bytes / BYTE_SCALE_FACTOR;

export const bytesToMb = (bytes: number) => bytesToKb(bytes) / BYTE_SCALE_FACTOR;

export const bytesToGb = (bytes: number) => bytesToMb(bytes) / BYTE_SCALE_FACTOR;

export const bytesToTb = (bytes: number) => bytesToGb(bytes) / BYTE_SCALE_FACTOR;

/**
 * Downward conversion functions to bytes
 */

export const kbToBytes = (kb: number) => kb * BYTE_SCALE_FACTOR;

export const mbToBytes = (mb: number) => kbToBytes(mb) * BYTE_SCALE_FACTOR;

export const gbToBytes = (gb: number) => mbToBytes(gb) * BYTE_SCALE_FACTOR;

export const tbToBytes = (tb: number) => gbToBytes(tb) * BYTE_SCALE_FACTOR;

/**
 * Upward conversion functions between units
 */

export const kbToMb = (kb: number) => kb / BYTE_SCALE_FACTOR;

export const mbToGb = (mb: number) => mb / BYTE_SCALE_FACTOR;

export const gbToTb = (gb: number) => gb / BYTE_SCALE_FACTOR;

/**
 * Downward conversion functions between units
 */

export const mbToKb = (mb: number) => mb * BYTE_SCALE_FACTOR;

export const gbToMb = (gb: number) => gb * BYTE_SCALE_FACTOR;

export const tbToGb = (tb: number) => tb * BYTE_SCALE_FACTOR;

/**
 * Convert bytes to a human-readable string
 */

export const bytesToHumanReadable = (bytes: number, decimalPlaces?: number) => {
  // If bytes is less than 1 KB, we'll default to 1 KB instead of showing bytes
  if (!bytes) {
    return '0 KB';
  }

  // If bytes is less than 1 KB, we'll default to 1 KB instead of showing bytes
  if (bytes < BYTE_SCALE_FACTOR) {
    return '1 KB';
  }

  if (bytes < mbToBytes(1)) {
    // Since KB are our smallest display unit, we'll default rounding to 0 decimal places unless specified
    return `${bytesToKb(bytes).toFixed(decimalPlaces ?? 0)} KB`;
  }

  if (bytes < gbToBytes(1)) {
    return `${bytesToMb(bytes).toFixed(decimalPlaces ?? 1)} MB`;
  }

  if (bytes < tbToBytes(1)) {
    return `${bytesToGb(bytes).toFixed(decimalPlaces ?? 1)} GB`;
  }

  return `${bytesToTb(bytes).toFixed(decimalPlaces ?? 1)} TB`;
};
