export const getGoogleOAuth2CodeInURL = () => {
  try {
    if (!window) return null;
    const url = new URL(window.location.href);
    const authCode = url.searchParams.get('code');
    const scope = url.searchParams.get('scope');
    const user = url.searchParams.get('authuser');
    return scope && user ? authCode : null;
  } catch (err) {
    return null;
  }
};

export const getOutlookCodeInURL = () => {
  try {
    if (!window) return null;
    const url = new URL(window.location.href);
    const authCode = url.searchParams.get('code');
    const session = url.searchParams.get('client_info');
    return session ? authCode : null;
  } catch (err) {
    return null;
  }
};
