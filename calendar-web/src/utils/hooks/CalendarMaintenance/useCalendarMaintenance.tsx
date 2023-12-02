import { useEffect } from 'react';
import { useToast } from 'skiff-front-utils';
import { assertExists } from 'skiff-utils';

import { useCurrentCalendarID } from '../../../apollo/currentCalendarMetadata';
import { db } from '../../../storage/db/db';
import { ErrorHandlerMetadataDB } from '../../../storage/models/ErrorHandlerMetadata';
import { DecryptedEventModel } from '../../../storage/models/event/DecryptedEventModel';

import { MaintenanceAction } from './types';
import { updateEventsWithDeletedAlias } from './updateEventsWithDeletedAliases';

const maintenanceActions: MaintenanceAction[] = [
  {
    id: 'update-events-with-deleted-alias',
    action: updateEventsWithDeletedAlias,
    toast: {
      title: 'Events were updated',
      body: `One of your invited aliases is no longer active`
    }
  }
];

/***
 * Hook that runs functions against all the events in the local db, it will be executed every time the calendar is opened
 */
export const useCalendarMaintenance = () => {
  const { enqueueToast } = useToast();
  const calendarID = useCurrentCalendarID();
  useEffect(() => {
    const runMaintenance = async () => {
      if (!calendarID) return;
      assertExists(db, 'useCalendarMaintenance: db not defined');

      // get all the events in the DB
      const allEncryptedEvents = await db.events.toArray();
      const allDecryptedEvents = await DecryptedEventModel.fromManyDexie(allEncryptedEvents || []);

      // run maintenance action on the events
      await Promise.all(
        maintenanceActions.map(async (action) => {
          try {
            const shouldToast = await action.action(allDecryptedEvents);
            if (shouldToast && action.toast) {
              enqueueToast(action.toast);
            }
          } catch (err) {
            console.error('Failed running maintenance action:', action.id, err);
            await ErrorHandlerMetadataDB.create({
              parentEventID: action.id,
              calendarID: calendarID,
              lastUpdated: Date.now(),
              message: [(err as { toString: () => string }).toString()]
            });
          }
        })
      );
    };

    void runMaintenance();
  }, [enqueueToast, calendarID]);
};
