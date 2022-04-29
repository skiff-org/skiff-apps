export function stringToColor(str: string) {
  const stringUniqueHash = [...str].reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  return `hsl(${stringUniqueHash % 360}, 95%, 35%)`;
}
