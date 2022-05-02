/**
 * Concatenate several Uint8Arrays together.
 * Equivalent to calling `Uint8Array.of(...u8s[0], ...u8s[1], ...)` but shouldn't blow up the stack for large arrays.
 *
 * @param u8s some Uint8Arrays
 * @returns a Uint8Array
 */
export function concatUint8Arrays(...u8s: Uint8Array[]): Uint8Array {
  let totalLen = 0;
  u8s.forEach((elem) => {
    totalLen += elem.byteLength;
  });

  const ret: Uint8Array = new Uint8Array(totalLen);

  let index = 0;
  u8s.forEach((elem) => {
    ret.set(elem, index);
    index += elem.byteLength;
  });

  return ret;
}
