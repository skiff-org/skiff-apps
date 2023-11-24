// Return true if running on server, otherwise return false
export default function isServerSide() {
  return typeof window !== 'object';
}
