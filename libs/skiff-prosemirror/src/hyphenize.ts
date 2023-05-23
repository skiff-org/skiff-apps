function hadnleMatch(matched: string): string {
  return `${matched[0]}-${matched[1].toLowerCase()}`;
}

const cached = {}; // converts `fooBar` to `foo-bar`.

export default function hyphenize(str: string): string {
  if (cached.hasOwnProperty(str)) {
    return cached[str];
  }

  const result = str.replace(/[a-z][A-Z]/g, hadnleMatch);
  cached[str] = result;
  return result;
}
