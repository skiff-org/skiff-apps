import jwt_decode, { JwtDecodeOptions } from 'jwt-decode';

/**
 * Decodes the jwt and catches any invalid token errors by returning undefined.
 * @param {string} token - JSON web token to decode
 * @param {JwtDecodeOptions} options - JWT header options
 * @returns {any | undefined} Returns a decoded JWT or undefined if an error is thrown
 */
export function decodeJWT(token: string, options?: JwtDecodeOptions) {
  try {
    return jwt_decode(token, options);
  } catch (error) {
    console.log(error);
    return undefined;
  }
}
