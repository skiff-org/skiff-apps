export function ab2str(buf: ArrayBuffer) {
  const enc = new TextDecoder('utf-8');
  return enc.decode(buf);
}
