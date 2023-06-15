/* eslint-disable max-classes-per-file */

import { Range } from 'semver';
import { utf8BytesToString, utf8StringToBytes } from 'skiff-utils';

import { DatagramV2 } from './common';

/**
 * Create a datagram that encode and decode any JSON.stringify-able data
 * @param {string} type datagram type
 * @param {string} version datagram version, default 0.1.0
 * @param {Range} versionConstraint datagram version contraint, default 0.1.*
 */
export const createRawJSONDatagramV2 = <Header, Body>(
  type: string,
  version = '0.1.0',
  versionConstraint = new Range('0.1.*')
) => {
  if (!versionConstraint.test(version)) {
    throw new Error("Provided version constraint doesn't validate provided version");
  }
  const datagram: DatagramV2<Header, Body> = {
    versionConstraint,
    version,
    type,
    serializeBody(data) {
      return utf8StringToBytes(JSON.stringify(data));
    },
    deserializeBody(data) {
      return JSON.parse(utf8BytesToString(data)) as Body;
    },
    serializeHeader(header) {
      return utf8StringToBytes(JSON.stringify(header));
    },
    deserializeHeader: (header) => JSON.parse(utf8BytesToString(header)) as Header
  };
  return datagram;
};
