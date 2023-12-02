import Dexie, { DBCore, DbEvents, DexieError, DexieEvent, Middleware, Table } from 'dexie';
import loggerMiddleware, { LogType } from 'dexie-logger';
import { isIOS } from 'react-device-detect';
import { isMobileApp } from 'skiff-front-utils';

import { mobileBackgroundMiddleware } from '../middleware/mobileBackground';
import { pushMiddleware } from '../middleware/push';
import { CalendarMetadata } from '../schemas/calendarMetadata';
import { EncryptedDraft } from '../schemas/draft';
import { ErrorHandlerMetadata } from '../schemas/errorHandlerMetadata';
import { EncryptedEvent } from '../schemas/event';
import { EventToRecover } from '../schemas/eventToRecover';

const LOGGER_ENABLED = process.env.NODE_ENV === 'development' && !isMobileApp();

interface DbEventsWithUpdateEvent extends DbEvents {
  update: DexieEvent;
}

export class CalendarDB extends Dexie {
  events!: Table<EncryptedEvent>;

  drafts!: Table<EncryptedDraft>;

  calendarMetadata!: Table<CalendarMetadata>;

  errorHandlerState!: Table<ErrorHandlerMetadata>;

  eventsToRecover!: Table<EventToRecover>;

  constructor(userID: string, calendarID: string) {
    super(`calendarDB_${userID}_${calendarID}`);

    this.on.addEventType('update');

    this.middlewares();
    this.migrations();

    this.on('populate', async (tr) => {
      const syncCount = await tr.table('calendarMetadata').count();
      if (syncCount === 0)
        await tr.table('calendarMetadata').add({ updatedAt: null, calendarID: null, initializedLocalDB: false });
    });
  }

  fireEventUpdate() {
    const on = this.on as DbEventsWithUpdateEvent;
    void on.update.fire();
  }

  middlewares() {
    this.use(
      pushMiddleware(() => {
        this.fireEventUpdate();
      })
    );

    // To add logs, simply add the table name to the tableWhiteList
    if (LOGGER_ENABLED) {
      this.use(
        loggerMiddleware({
          tableWhiteList: ['events'],
          operationsBlackList: ['openCursor'],
          logType: LogType.Minimal
        }) as Middleware<DBCore>
      );
    }

    if (isMobileApp() && isIOS) {
      this.use(mobileBackgroundMiddleware);
    }
  }

  migrations() {
    this.version(1).stores({
      events: '&parentEventID, title, description, color, startDate, endDate, externalID'
    });

    this.version(2).stores({
      events: '&parentEventID, title, description, color, startDate, endDate, externalID'
    });

    this.version(3).stores({
      events: '&parentEventID, title, description, color, startDate, endDate, externalID, deleted, updatedAt', // Primary key and indexed props
      calendarMetadata: '++, lastUpdated, calendarID'
    });

    this.version(4).stores({
      events:
        '&parentEventID, title, description, color, startDate, endDate, externalID, deleted, updatedAt, syncState', // Primary key and indexed props
      calendarMetadata: '++, lastUpdated, calendarID'
    });

    this.version(5).stores({
      events:
        '&parentEventID, title, description, color, startDate, endDate, externalID, deleted, updatedAt, syncState', // Primary key and indexed props
      calendarMetadata: '++, lastUpdated, calendarID, encryptedPrivateKey, encryptedByKey'
    });

    this.version(6).stores({
      events: '&parentEventID, startDate, endDate, externalID, deleted, updatedAt, syncState', // Primary key and indexed props
      calendarMetadata: '++, lastUpdated, calendarID, encryptedPrivateKey, encryptedByKey, publicKey'
    });

    this.version(7).stores({
      events:
        '&parentEventID, title, description, color, startDate, endDate, externalID, deleted, updatedAt, syncState', // Primary key and indexed props
      calendarMetadata: '++, lastUpdated, calendarID, encryptedPrivateKey, encryptedByKey, publicKey',
      errorHandlerState: '&parentEventID, calendarID, lastUpdated'
    });

    this.version(8).stores({
      events:
        '&parentEventID, title, description, color, startDate, endDate, externalID, deleted, updatedAt, syncState', // Primary key and indexed props
      calendarMetadata: '++, lastUpdated, calendarID, encryptedPrivateKey, encryptedByKey, publicKey',
      errorHandlerState: '&errorID, parentEventID, calendarID, lastUpdated, message, count, emailID'
    });

    this.version(9).stores({
      events:
        '&parentEventID, title, description, color, startDate, endDate, externalID, deleted, updatedAt, syncState', // Primary key and indexed props
      calendarMetadata: '++, lastUpdated, calendarID, encryptedPrivateKey, encryptedByKey, publicKey',
      errorHandlerState: '&errorID, parentEventID, calendarID, lastUpdated, message, count, emailID',
      drafts: '&parentEventID, startDate, endDate'
    });

    // remove unused indexes
    this.version(10).stores({
      //Removed 'title', 'description', 'color', 'deleted'
      events: '&parentEventID, startDate, endDate, externalID, updatedAt, syncState',
      //Removed 'lastUpdated', 'calendarID', 'encryptedPrivateKey', 'encryptedByKey', 'publicKey'
      calendarMetadata: '++',
      //Removed 'parentEventID', 'calendarID', 'lastUpdated', 'message', 'count', 'emailID'
      errorHandlerState: '&errorID',
      drafts: '&parentEventID, startDate, endDate'
    });

    // Add recurrenceRule and parentRecurrenceID
    this.version(11).stores({
      // added 'recurrenceRule', 'parentRecurrenceID'
      events:
        '&parentEventID, recurrenceRule, parentRecurrenceID, startDate, endDate, externalID, updatedAt, syncState',
      calendarMetadata: '++',
      errorHandlerState: '&errorID',
      // added 'recurrenceRule'
      drafts: '&parentEventID, recurrenceRule, startDate, endDate'
    });

    // Create the events to recover table
    this.version(12).stores({
      events:
        '&parentEventID, recurrenceRule, parentRecurrenceID, startDate, endDate, externalID, updatedAt, syncState',
      calendarMetadata: '++',
      errorHandlerState: '&errorID',
      drafts: '&parentEventID, recurrenceRule, startDate, endDate',
      // Added events to recover table
      eventsToRecover: '&parentEventID, createdAt'
    });
  }
}

let db: CalendarDB | undefined;

function isDexieVersionError(error: unknown): error is DexieError {
  // Checking inner error, external is DBClosedError
  return (
    (error as DexieError).inner !== undefined &&
    ((error as DexieError).inner as DexieError).name === Dexie.errnames.Version
  );
}

async function initializeDB(userID: string, calendarID: string) {
  db = new CalendarDB(userID, calendarID);
  try {
    await db.calendarMetadata.toArray();
  } catch (error) {
    if (isDexieVersionError(error)) {
      await db.delete();
      db = new CalendarDB(userID, calendarID);
    }
  }
}

export { db, initializeDB };
