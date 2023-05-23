import varint from 'varint';

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

/**
 *
 * @param o - object containing a reference to a Uint8Array. Modifies this value in-place.
 */
export function extractVarintPrefixed(o: { bs: Uint8Array }): Uint8Array {
  // Extract a varint-prefixed value from the underlying byte array.
  // a varint is a multi-byte 7-bit encoding of a number representing how many of the following bytes
  // are a part of this field. The 8th bit represents whether or not the number is continued into the next byte.

  // For example, if we had 130 bytes of content that have been serialized with a leading varint prefix,
  // we would have 132 bytes of data. The first two bytes would encode the length of 130, and the rest is the content.

  const chunkLen = varint.decode(o.bs); // Extract the length of the chunk
  const chunkLenLen = varint.encodingLength(chunkLen); // Figure out how many bytes were used to express that length
  const chunk = o.bs.slice(chunkLenLen, chunkLen + chunkLenLen); // Extract that chunk

  o.bs = o.bs.slice(chunkLen + chunkLenLen);

  return chunk;
}

export function varintPrefixed(data: Uint8Array): Uint8Array {
  return concatUint8Arrays(Uint8Array.from(varint.encode(data.length)), data);
}
