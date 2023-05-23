import { concatUint8Arrays, varintPrefixed } from './typedArraysUtils';

describe('test concatenation', () => {
  test('simple', () => {
    const a = Uint8Array.of(1, 2, 3);
    const b = Uint8Array.of(4, 5);
    const c = Uint8Array.of(6, 7, 8);

    expect(concatUint8Arrays(a, b, c)).toEqual(Uint8Array.of(1, 2, 3, 4, 5, 6, 7, 8));
  });

  test('varint prefixed', () => {
    const a = Uint8Array.of(1, 2, 3, 4, 5, 6);

    expect(varintPrefixed(a)).toEqual(Uint8Array.of(6, 1, 2, 3, 4, 5, 6));
  });
});
