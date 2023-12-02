import { assertExists, filterExists } from 'skiff-utils';

import { db } from '../db/db';
import { EventToRecover } from '../schemas/eventToRecover';

const MAX_TRY_COUNT = 5;

type EventToRecoverDate = Omit<EventToRecover, 'createdAt'> & { createdAt: Date };

export class EventToRecoverModel implements EventToRecoverDate {
  parentEventID: string;

  createdAt: Date;

  tryCount: number;

  constructor(args: { parentEventID: string; createdAt?: Date; tryCount?: number }) {
    this.parentEventID = args.parentEventID;
    this.createdAt = args.createdAt ?? new Date();
    this.tryCount = args.tryCount ?? 0;
  }

  static fromDexie(args: EventToRecover): EventToRecoverModel {
    return new EventToRecoverModel({
      parentEventID: args.parentEventID,
      createdAt: new Date(args.createdAt),
      tryCount: args.tryCount
    });
  }

  increaseTryCount() {
    this.tryCount += 1;
  }

  toDexie(): EventToRecover {
    return {
      parentEventID: this.parentEventID,
      createdAt: this.createdAt.getTime(),
      tryCount: this.tryCount
    };
  }
}

/**
 * This class is used to store events that failed to sync.
 * We use this to recover events that failed to sync.
 */
export class EventsToRecover {
  static async getMany(eventIDs: string[]): Promise<EventToRecoverModel[]> {
    assertExists(db, 'EventsToRecover getTryCount: DB is closed');
    const eventsToRecover = (await db.eventsToRecover.bulkGet(eventIDs)).filter(filterExists);
    return eventsToRecover.map((eventToRecover) => EventToRecoverModel.fromDexie(eventToRecover));
  }

  /**
   * Gets the next batch of events to recover.
   */
  static async get(limit: number): Promise<EventToRecoverModel[]> {
    assertExists(db, 'EventsToRecover get: DB is closed');
    const eventsToRecover = (await db.eventsToRecover.orderBy('createdAt').toArray())
      .filter((eventToRecover) => (eventToRecover.tryCount || 0) < MAX_TRY_COUNT)
      .sort((a, b) => (a.tryCount || 0) - (b.tryCount || 0))
      .slice(0, limit);
    return eventsToRecover.map((eventToRecover) => EventToRecoverModel.fromDexie(eventToRecover));
  }

  /**
   * Gets all the events to recover.
   */
  static async getAll(): Promise<EventToRecoverModel[]> {
    assertExists(db, 'EventsToRecover getAll: DB is closed');
    const eventsToRecover = await db.eventsToRecover.toArray();
    return eventsToRecover.map((eventToRecover) => EventToRecoverModel.fromDexie(eventToRecover));
  }

  static async remove(eventID: string): Promise<void> {
    assertExists(db, 'EventsToRecover remove: DB is closed');
    console.log(`Recovering event ${eventID}`);
    await db.eventsToRecover.delete(eventID);
  }

  static async removeMany(eventsIDs: string[]): Promise<void> {
    assertExists(db, 'EventsToRecover removeMany: DB is closed');
    console.log(`Recovering ${eventsIDs.length} events`, {
      eventsIDs
    });
    await db.eventsToRecover.bulkDelete(eventsIDs);
  }

  static async add(eventID: string): Promise<void> {
    assertExists(db, 'EventsToRecover add: DB is closed');
    console.warn(`Adding event ${eventID} to recover`);
    if (await db.eventsToRecover.get(eventID)) return;

    const eventToRecover = new EventToRecoverModel({ parentEventID: eventID });

    await db.eventsToRecover.add(eventToRecover.toDexie());
  }

  static async addMany(eventIDs: string[]): Promise<void> {
    assertExists(db, 'EventsToRecover addMany: DB is closed');
    const eventsIDsWithoutDuplicates = eventIDs.filter(async (eventID) => {
      assertExists(db, 'EventsToRecover addMany: DB is closed');
      return !(await db.eventsToRecover.get(eventID));
    });
    console.warn(`Adding ${eventsIDsWithoutDuplicates.length} events to recover`, {
      eventsIDsWithoutDuplicates
    });

    const eventsToRecover = eventsIDsWithoutDuplicates.map(
      (eventID) =>
        new EventToRecoverModel({
          parentEventID: eventID
        })
    );

    await db.eventsToRecover.bulkAdd(eventsToRecover.map((eventToRecover) => eventToRecover.toDexie()));
  }

  static async increaseTryCount(eventIDs: string[]): Promise<void> {
    assertExists(db, 'EventsToRecover increaseTryCount: DB is closed');
    console.warn(`Increasing try count for ${eventIDs.length} events`, {
      eventIDs
    });

    const eventsToRecover = await EventsToRecover.getMany(eventIDs);
    eventsToRecover.forEach((eventToRecover) => eventToRecover.increaseTryCount());
    await db.eventsToRecover.bulkPut(eventsToRecover.map((eventToRecover) => eventToRecover.toDexie()));
  }
}
