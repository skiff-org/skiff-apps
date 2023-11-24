export const validateDisplayName = (displayName: string) => {
  if (!displayName) {
    return false;
  }
  const trimmedName = displayName.trim();
  if (trimmedName.length > 200 || !/^(?:[,.'\-_\p{L}()\d]+)(?: (?:[,.'\-_\p{L}()\d]+))*$/u.test(trimmedName)) {
    return false;
  }
  return true;
};
