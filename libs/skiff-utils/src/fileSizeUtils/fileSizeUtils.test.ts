import {
  bytesToKb,
  bytesToMb,
  bytesToGb,
  bytesToTb,
  kbToBytes,
  mbToBytes,
  gbToBytes,
  tbToBytes,
  kbToMb,
  mbToGb,
  gbToTb,
  mbToKb,
  gbToMb,
  tbToGb,
  bytesToHumanReadable
} from './fileSizeUtils';

describe('File size Utils', () => {
  // Upward conversion functions from bytes
  test('bytesToKb', () => {
    expect(bytesToKb(1000)).toBe(1);
  });

  test('bytesToMb', () => {
    expect(bytesToMb(1000_000)).toBe(1);
  });

  test('bytesToGb', () => {
    expect(bytesToGb(1000_000_000)).toBe(1);
  });

  test('bytesToTb', () => {
    expect(bytesToTb(1000_000_000_000)).toBe(1);
  });

  // Downward conversion functions to bytes
  test('kbToBytes', () => {
    expect(kbToBytes(1)).toBe(1000);
  });

  test('mbToBytes', () => {
    expect(mbToBytes(1)).toBe(1000_000);
  });

  test('gbToBytes', () => {
    expect(gbToBytes(1)).toBe(1000_000_000);
  });

  test('tbToBytes', () => {
    expect(tbToBytes(1)).toBe(1000_000_000_000);
  });

  // Upward conversion functions between units
  test('kbToMb', () => {
    expect(kbToMb(1000)).toBe(1);
  });

  test('mbToGb', () => {
    expect(mbToGb(1000)).toBe(1);
  });

  test('gbToTb', () => {
    expect(gbToTb(1000)).toBe(1);
  });

  // Downward conversion functions between units
  test('mbToKb', () => {
    expect(mbToKb(1)).toBe(1000);
  });

  test('gbToMb', () => {
    expect(gbToMb(1)).toBe(1000);
  });

  test('tbToGb', () => {
    expect(tbToGb(1)).toBe(1000);
  });

  // Convert bytes to a human-readable string
  test('bytesToHumanReadable with default decimalPlaces', () => {
    expect(bytesToHumanReadable(0)).toBe('0 KB');
    expect(bytesToHumanReadable(500)).toBe('1 KB');
    expect(bytesToHumanReadable(1500)).toBe('2 KB');
    expect(bytesToHumanReadable(1_500_000)).toBe('1.5 MB');
    expect(bytesToHumanReadable(1_500_000_000)).toBe('1.5 GB');
    expect(bytesToHumanReadable(1_500_000_000_000)).toBe('1.5 TB');

    // Verified that a value exactly on the line is handled correctly
    expect(bytesToHumanReadable(1_000_000_000_000, 0)).toBe('1 TB');
  });

  test('bytesToHumanReadable with custom decimalPlaces', () => {
    expect(bytesToHumanReadable(1500, 2)).toBe('1.50 KB');
    expect(bytesToHumanReadable(1_500_000, 3)).toBe('1.500 MB');
    expect(bytesToHumanReadable(1_500_000_000, 0)).toBe('2 GB');
    expect(bytesToHumanReadable(1_500_000_000_000, 2)).toBe('1.50 TB');

    // Verified that a value exactly on the line is handled correctly
    expect(bytesToHumanReadable(1_000_000_000_000, 0)).toBe('1 TB');
  });
});
