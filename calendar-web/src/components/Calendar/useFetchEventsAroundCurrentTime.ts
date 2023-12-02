import Dexie from 'dexie';
import { useEffect } from 'react';
import { requireCurrentUserData } from 'skiff-front-utils';
import { assertExists } from 'skiff-utils';

import { GetEventsAroundDateDocument, GetEventsAroundDateQuery } from '../../../generated/graphql';
import client from '../../apollo/client';
import { useCurrentCalendarMetadata } from '../../apollo/currentCalendarMetadata';
import { decryptPrivateCalendarKeyForUser } from '../../crypto/calendar';
import { toEncryptedEvent } from '../../crypto/cryptoWebWorker';
import { getSelectedViewDateFromUrl } from '../../redux/reducers/timeReducer';
import { requireAllResolvedAndSplitAttendees } from '../../storage/crypto/utils';
import { db } from '../../storage/db/db';
import { DecryptedEventModel } from '../../storage/models/event/DecryptedEventModel';
import { getEventByID, saveContent } from '../../storage/models/event/modelUtils';

export const useFetchEventsAroundCurrentTime = () => {
  const calendarMetadata = useCurrentCalendarMetadata();

  const { calendarID, encryptedPrivateKey, publicKey } = calendarMetadata || {
    calendarID: undefined,
    encryptedPrivateKey: undefined,
    publicKey: undefined
  };

  useEffect(() => {
    void (async () => {
      if (!calendarID || !db) return;

      const userData = requireCurrentUserData();
      const selectedViewDate = getSelectedViewDateFromUrl();

      const { data: events } = await client.query<GetEventsAroundDateQuery>({
        query: GetEventsAroundDateDocument,
        variables: {
          request: {
            calendarID: calendarID,
            date: selectedViewDate.toDate()
          }
        }
      });
      if (!events) return;

      const activeCalendarPrivateKey = encryptedPrivateKey
        ? decryptPrivateCalendarKeyForUser(encryptedPrivateKey, userData.publicKey, userData.privateUserData.privateKey)
        : userData.privateUserData.privateKey;

      // insert events to the db.
      // before each insert check if the event already exist (possible if the sync already received the event)
      await Promise.allSettled(
        events.eventsAroundDate.map(async (pulledEvent) => {
          assertExists(db, 'useFetchEventsAroundCurrentTime: DB is closed');
          if (!pulledEvent) return;

          const newEvent = await DecryptedEventModel.fromGraphql(pulledEvent, activeCalendarPrivateKey, publicKey);
          const attendeesForEncryption = requireAllResolvedAndSplitAttendees(newEvent.decryptedContent.attendees);
          const encryptedEvent = await toEncryptedEvent(
            newEvent,
            publicKey,
            activeCalendarPrivateKey,
            attendeesForEncryption
          );

          return db.transaction('rw!', db.events, db.calendarMetadata, async () => {
            assertExists(db, 'useFetchEventsAroundCurrentTime: DB is closed');

            const eventFromDB = await Dexie.waitFor(getEventByID(pulledEvent.parentEventID, true));
            if (eventFromDB) {
              await saveContent(newEvent, false, eventFromDB.localMetadata.syncState);
            } else {
              await db.events.add(encryptedEvent);
            }
          });
        })
      );
    })();
  }, [calendarID, publicKey, encryptedPrivateKey]);
};
