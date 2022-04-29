// Get origin for editor.
export const getEditorBasePath = () => {
  const origin = window.location.origin;
  const reviewAppPhrase = 'skemail-web-pr-';
  const containerPhrase = 'skemail-web';
  // local env once it's added to the frontend
  if (origin.includes('localhost')) {
    return 'http://localhost:1212';
  }

  // For skemail-web.skiff.X
  if (origin.includes(containerPhrase)) {
    const subdomainEndIndex = origin.indexOf(containerPhrase) + containerPhrase.length;
    // This is .skiff.X
    const containerOriginSuffix = origin.slice(subdomainEndIndex);
    return `https://app${containerOriginSuffix}`;
  }

  // The editor origin for dev, staging, and production are the same as skemail
  return origin;
};

export const openSettingsPage = () =>
  window.open(`${getEditorBasePath()}/settings/account`, '_blank', 'noreferrer noopener');
