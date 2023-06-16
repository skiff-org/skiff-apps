export type DecodedJWT = {
  exp: number;
  aud: string;
  userID?: string;
  email?: string;
  docID?: string; // for access request
  updatedEmail?: string; // used for change email
  curEmail?: string; // used for change email
  newEmail?: string; // for add email
  documentLink?: string; // link to access document
  inviteID?: string; // invite ID for shared external user
  userAttributionData?: {
    referrerUsername?: string; // referring user username
  };
};

/**
 * Generate a cryptographically secure random password in the browser.
 *
 * This is a modified version of https://stackoverflow.com/a/43020177/450127 that aims to
 * to improve readability, and increase the length and character pool. The results should be
 * the same as the original.
 *
 * @returns {string}
 */
export function generateRandomPassword() {
  const characterPool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  const pwLength = 24;
  const randomNumbers = new Uint32Array(1);
  const umax = Math.pow(2, 32);
  const max = umax - (umax % characterPool.length);

  let passwordBytes = new Array(pwLength).fill(0);

  passwordBytes = passwordBytes.map(() => {
    do {
      crypto.getRandomValues(randomNumbers); // Overwrite the existing numbers with new ones.
    } while (randomNumbers[0] > max);

    const randomPosition = randomNumbers[0] % characterPool.length;
    return characterPool[randomPosition];
  });
  return passwordBytes.join('');
}
