/* eslint-disable max-classes-per-file */

import { Range } from 'semver';

import { Datagram } from './aead/common';
import { utf8BytesToString, utf8StringToBytes } from './utf8';

/**
 * Create a datagram that encode and decode any JSON.stringify-able data in a object containing {version, type, data}.
 * This is for legacy purpose, any new datagram should use the createRawJSONDatagram that doesn't add the version and type inside
 * the encrypted body (as these info are already containained inside the header)
 * @param {string} type datagram type
 * @param {string} version datagram version, default 0.1.0
 * @param {Range} versionConstraint datagram version contraint, default 0.1.*
 */
export const createJSONWrapperDatagram = <T>(
  type: string,
  version = '0.1.0',
  versionConstraint = new Range('0.1.*')
) => {
  if (!versionConstraint.test(version)) {
    throw new Error("Provided version constraint doesn't validate provided version");
  }
  const datagram: Datagram<T> = {
    versionConstraint,
    version,
    type,
    serialize(data) {
      return utf8StringToBytes(JSON.stringify({ version, type, data }));
    },
    deserialize(data) {
      const parsed = JSON.parse(utf8BytesToString(data));
      return parsed.data;
    }
  };
  return datagram;
};

/**
 * Create a datagram that encode and decode any JSON.stringify-able data
 * @param {string} type datagram type
 * @param {string} version datagram version, default 0.1.0
 * @param {Range} versionConstraint datagram version contraint, default 0.1.*
 */
export const createRawJSONDatagram = <T>(type: string, version = '0.1.0', versionConstraint = new Range('0.1.*')) => {
  if (!versionConstraint.test(version)) {
    throw new Error("Provided version constraint doesn't validate provided version");
  }
  const datagram: Datagram<T> = {
    versionConstraint,
    version,
    type,
    serialize(data) {
      return utf8StringToBytes(JSON.stringify(data));
    },
    deserialize(data) {
      return JSON.parse(utf8BytesToString(data));
    }
  };
  return datagram;
};

/**
 * Create a datagram that encode and decode a raw Uint8Array object, this is the best for size optimization
 * @param {string} type datagram type
 * @param {string} version datagram version, default 0.1.0
 * @param {Range} versionConstraint datagram version contraint, default 0.1.*
 */
export const createUint8ArrayDatagram = (type: string, version = '0.1.0', versionConstraint = new Range('0.1.*')) => {
  if (!versionConstraint.test(version)) {
    throw new Error("Provided version constraint doesn't validate provided version");
  }
  const datagram: Datagram<Uint8Array> = {
    versionConstraint,
    version,
    type,
    serialize(data) {
      return data;
    },
    deserialize(data) {
      return data;
    }
  };
  return datagram;
};

/**
 * RecoveryServerShareDatagram stores the server share for a user's recovery data.
 */
export const RecoveryServerShareDatagram = createJSONWrapperDatagram<string>('ddl://skiff/RecoveryServerShareDatagram');

/**
 * DataMFADatagram stores a user's MFA key.
 */
export const DataMFADatagram = createJSONWrapperDatagram<string>('ddl://skiff/DataMFADatagram');

/**
 * DataSessionCacheDatagram stores a session cache key.
 */
export const SessionCacheKeyDatagram = createJSONWrapperDatagram<string>('ddl://skiff/DataSessionCacheDatagram');

/**
 * DataDatagram stores end-to-end encrypted bytes, such as the data sent over a websocket
 * to other document editors.
 */
export const DataDatagram = createUint8ArrayDatagram('ddl://skiff/DataDatagram');
