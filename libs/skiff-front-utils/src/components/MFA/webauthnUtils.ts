import { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/typescript-types';

export function isPublicKeyCredentialCreationOptionsJSON(obj: any): obj is PublicKeyCredentialCreationOptionsJSON {
  return (
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    typeof obj.rp === 'object' &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    typeof obj.user === 'object' &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    typeof obj.challenge === 'string' &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    Array.isArray(obj.pubKeyCredParams) &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (typeof obj.timeout === 'undefined' || typeof obj.timeout === 'number') &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (typeof obj.excludeCredentials === 'undefined' || Array.isArray(obj.excludeCredentials)) &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (typeof obj.authenticatorSelection === 'undefined' || typeof obj.authenticatorSelection === 'object') &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (typeof obj.attestation === 'undefined' || typeof obj.attestation === 'string') &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (typeof obj.extensions === 'undefined' || typeof obj.extensions === 'object')
  );
}
