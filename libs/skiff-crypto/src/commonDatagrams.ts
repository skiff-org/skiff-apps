import { createJSONWrapperDatagram, createUint8ArrayDatagram } from './datagramBuilders';

// Used for WebSocket messages between clients
export const DataDatagram = createUint8ArrayDatagram('ddl://skiff/DataDatagram');

/**
 * PrivateUserData stores a user's sensitive account encryption/signing keys.
 */
export interface PrivateUserData {
  privateKey: string;
  signingPrivateKey: string;
  documentKey: string; // used to encrypt PrivateDocumentData
}
/**
 * PrivateUserDataDatagram stores a user's end-to-end encrypted user data.
 */
export const PrivateUserDataDatagram = createJSONWrapperDatagram<PrivateUserData>(
  'ddl://skiff/PrivateUserDataDatagram'
);
