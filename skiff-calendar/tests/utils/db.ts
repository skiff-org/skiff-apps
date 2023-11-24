// eslint-disable-next-line import/no-extraneous-dependencies
import 'fake-indexeddb/auto';
import { randomUUID } from 'crypto';

import { initializeDB } from '../../src/storage/db/db';
import { CalendarMetadataDB } from '../../src/storage/models/CalendarMetadata';

export const initializeTestDB = async (
  publicKey: string,
  encryptedByKey: string,
  setCalendarID?: string
): Promise<string> => {
  const calendarID = setCalendarID || randomUUID();
  await initializeDB('UserID', calendarID);
  await CalendarMetadataDB.updateMetadata({
    calendarID,
    publicKey,
    encryptedPrivateKey: undefined,
    encryptedByKey
  });

  return calendarID;
};
