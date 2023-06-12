export const utf8StringToBytes = (data: string) => {
  const utf8encoder = new TextEncoder();
  return utf8encoder.encode(data);
};

export const utf8BytesToString = (data: Uint8Array) => {
  const utf8decoder = new TextDecoder();
  return utf8decoder.decode(data);
};
