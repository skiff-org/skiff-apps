import QRCode from 'qrcode';

const APP_NAME = 'Skiff';

/**
 * Handles MFA configuration
 * @param {string} username
 * @returns {Promise<{ generatedSecret: string, url: string, error: string }>}
 */
// Handles MFA configuration by setting QR code and TOTP seed
export const configureMFA = async (
  username: string
): Promise<{ generatedSecret: string; url: string; error: string }> => {
  const { authenticator } = await import('otplib');
  const generatedSecret = authenticator.generateSecret();
  const keyUri: string = authenticator.keyuri(username, APP_NAME, generatedSecret);
  const url = await QRCode.toDataURL(keyUri);
  return { generatedSecret, url, error: !url ? 'Error QR code not fetched. Try again.' : '' };
};
