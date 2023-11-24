/* eslint-disable max-classes-per-file */

import { createJSONWrapperDatagram } from 'skiff-crypto';

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
 * The user signature datagram stores the encrypted copy of the user signature.
 */
export const UserSignatureDatagram = createJSONWrapperDatagram<string>('ddl://skiff/UserSignatureDatagram');


/**
 * The pgp key datagram stores the encrypted copy of the pgp key.
 */
export const PgpKeyDatagram = createJSONWrapperDatagram<string>('ddl://skiff/PgpKeyDatagram');
