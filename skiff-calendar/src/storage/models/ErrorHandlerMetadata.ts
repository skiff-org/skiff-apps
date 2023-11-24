import dayjs from 'dayjs';
import { assertExists } from 'skiff-utils';
import { v4 } from 'uuid';

import { db } from '../db/db';
import { ErrorHandlerMetadata } from '../schemas/errorHandlerMetadata';
export class ErrorHandlerMetadataDB implements ErrorHandlerMetadata {
  lastUpdated?: number;

  calendarID: string;

  parentEventID?: string;

  errorID: string;

  message: string[];

  emailID?: string;

  count: number;

  protected constructor(args: {
    lastUpdated?: number;
    calendarID: string;
    parentEventID?: string;
    errorID: string;
    message: string[];
    emailID?: string;
    count?: number;
  }) {
    this.parentEventID = args.parentEventID;
    this.lastUpdated = args.lastUpdated;
    this.calendarID = args.calendarID;
    this.count = args.count || 1;
    this.message = args.message;
    this.errorID = args.errorID;
  }

  static async get(errorID: string): Promise<ErrorHandlerMetadataDB | null> {
    assertExists(db, 'DB is closed');
    const metadata = await db.errorHandlerState.get(errorID);
    if (!metadata) return null;
    return new ErrorHandlerMetadataDB(metadata);
  }

  static async getAll(): Promise<ErrorHandlerMetadataDB[]> {
    assertExists(db, 'DB is closed');
    const metadata = await db.errorHandlerState.toArray();
    return metadata.map((m) => new ErrorHandlerMetadataDB(m));
  }

  static async create(args: Omit<ErrorHandlerMetadata, 'errorID' | 'count'>) {
    assertExists(db, 'DB is closed');
    const errorID = args.parentEventID || args.emailID || v4();

    const existingError = await this.get(errorID);
    if (existingError) {
      await existingError.addNewError(args.message);
      return existingError;
    }

    await db.errorHandlerState.add({ ...args, errorID, count: 0 });
    return new ErrorHandlerMetadataDB({ ...args, errorID });
  }

  static async update(errorID: string): Promise<void> {
    assertExists(db, 'DB is closed');
    return db.transaction('rw!', db.errorHandlerState, async () => {
      assertExists(db, 'DB is closed');
      const state = await db.errorHandlerState.get(errorID);

      if (!state) {
        return;
      }

      const newUpdatedAt = dayjs().valueOf();
      const calendarID = state?.calendarID;

      await db.errorHandlerState.update(errorID, { calendarID, newUpdatedAt });
    });
  }

  async addNewError(message: string | string[]) {
    assertExists(db, 'DB is closed');

    const messages = typeof message === 'string' ? [message] : message;
    await db.transaction('rw!', db.errorHandlerState, async () => {
      assertExists(db, 'DB is closed');
      const state = await db.errorHandlerState.get(this.errorID);
      if (!state) return;

      const newUpdatedAt = dayjs().valueOf();
      const calendarID = state?.calendarID;

      await db.errorHandlerState.update(this.errorID, {
        calendarID,
        newUpdatedAt,
        message: [...state.message, ...messages],
        count: state.count + 1
      });
    });

    this.message = [...this.message, ...messages];
    this.count += 1;
  }
}
