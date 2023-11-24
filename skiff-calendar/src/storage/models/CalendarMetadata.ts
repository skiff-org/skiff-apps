import { generatePublicPrivateKeyPair } from 'skiff-crypto';
import { encryptSessionKey } from 'skiff-crypto';
import { PublicKey } from 'skiff-graphql';
import { assertExists } from 'skiff-utils';

import { encryptPrivateCalendarKeyForUser, decryptPrivateCalendarKeyForUser } from '../../crypto/calendar';
import { db } from '../db/db';
import { CalendarMetadata } from '../schemas/calendarMetadata';

export class CalendarMetadataDB implements CalendarMetadata {
  lastUpdated: number | undefined;

  calendarID: string;

  encryptedByKey: string;

  // Encrypted using shared key derrivation from the user's private key with the calendar's public key.
  encryptedPrivateKey: string | undefined;

  publicKey: string;

  initializedLocalDB: boolean;

  protected constructor(args: {
    lastUpdated?: number;
    calendarID: string;
    encryptedByKey: string;
    encryptedPrivateKey?: string;
    publicKey: string;
    initializedLocalDB: boolean;
  }) {
    this.lastUpdated = args.lastUpdated;
    this.calendarID = args.calendarID;
    this.encryptedPrivateKey = args.encryptedPrivateKey;
    this.publicKey = args.publicKey;
    this.encryptedByKey = args.encryptedByKey;
    this.initializedLocalDB = args.initializedLocalDB;
  }

  static async getMetadata(): Promise<CalendarMetadataDB | null> {
    assertExists(db, 'getMetadata: DB is closed');
    const metadata = await db.calendarMetadata.toArray();
    if (!metadata || metadata.length === 0) return null;
    return new CalendarMetadataDB(metadata[0]);
  }

  static fromMetadata(metadata: CalendarMetadata): CalendarMetadataDB {
    return new CalendarMetadataDB(metadata);
  }

  getDecryptedCalendarPrivateKey(userPrivateKey: string, userPublicKey: PublicKey): string {
    return this.encryptedPrivateKey
      ? decryptPrivateCalendarKeyForUser(this.encryptedPrivateKey, userPublicKey, userPrivateKey)
      : userPrivateKey;
  }

  encryptSessionKeyForCalendar(
    ourPrivateKey: string,
    ourPublicKey: PublicKey,
    theirPublicKey: PublicKey,
    sessionKey: string
  ) {
    const calendarPrivateKey = this.getDecryptedCalendarPrivateKey(ourPrivateKey, ourPublicKey);
    return encryptSessionKey(sessionKey, calendarPrivateKey, { key: this.publicKey }, theirPublicKey);
  }

  static async updateMetadata(updatedMetadata: Partial<CalendarMetadata>): Promise<void> {
    assertExists(db, 'updateMetadata: DB is closed');
    const allData = await db.calendarMetadata.toArray();

    if (allData.length === 0) {
      await db.calendarMetadata.add({ ...updatedMetadata, initializedLocalDB: false } as CalendarMetadata);
      return;
    }
    await db.calendarMetadata.update(1, updatedMetadata);
  }

  // Create key pair for new calendar and encrypt it with the user public key
  static createNewCalendarEncryptedPrivateKey(userPublicKey: PublicKey, userPrivateKey: string): [string, string] {
    const keypair = generatePublicPrivateKeyPair();
    const calendarEncryptedPrivateKey = encryptPrivateCalendarKeyForUser(
      keypair.privateKey,
      userPublicKey,
      userPrivateKey
    );

    return [calendarEncryptedPrivateKey, keypair.publicKey];
  }
}
