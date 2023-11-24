import { CircularProgress, Icon, Size } from 'nightwatch-ui';
import React, { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { ImportSelect, useToast, useRequiredCurrentUserData } from 'skiff-front-utils';
import { AttendeeStatus } from 'skiff-graphql';
import { parseICS } from 'skiff-ics';
import { filterExists } from 'skiff-utils';
import styled from 'styled-components';

import { getCurrentCalendarMetadata } from '../../../apollo/currentCalendarMetadata';
import { toEncryptedEvent } from '../../../crypto/cryptoWebWorker';
import { importReducer, ImportType } from '../../../redux/reducers/importReducer';
import { requireAllResolvedAndSplitAttendees } from '../../../storage/crypto/utils';
import { DecryptedEventModel } from '../../../storage/models/event/DecryptedEventModel';
import { addBulkNewEvents, deleteEventByID, getEventsByExternalID } from '../../../storage/models/event/modelUtils';
import { EncryptedEvent } from '../../../storage/schemas/event';
import { useAppSelector } from '../../../utils';
import { addUserAttendeeIfNeeded } from '../../../utils/sync/icsUtils';
import { useCloseSettings } from '../useOpenCloseSettings';

const LoadingContainer = styled.div`
  display: flex;
  width: 100%;
  height: 40px;
  align-items: center;
  justify-content: center;
`;

export const ImportICS = () => {
  const { enqueueToast } = useToast();
  const user = useRequiredCurrentUserData();
  const icsInputRef = useRef<HTMLInputElement>(null);

  const activeImportTypes = useAppSelector((app) => app.import.activeImport);
  const dispatch = useDispatch();
  const closeSettings = useCloseSettings();

  const importIcsFile = useCallback(
    async (file: File) => {
      const calendarMetadata = await getCurrentCalendarMetadata();
      if (!calendarMetadata) return;
      const fileContent = await file.text();
      const parsedICS = parseICS(fileContent);

      const events = (
        await Promise.all(
          parsedICS.events.map(async (parsedEvent) => {
            const currentEvents = await getEventsByExternalID(parsedEvent.id, false);

            if (currentEvents.length === 0) {
              const newEvents = await DecryptedEventModel.fromParsedICS(
                parsedEvent,
                calendarMetadata.calendarID,
                undefined,
                undefined,
                undefined,
                true
              );
              if (newEvents[0].plainContent.startDate > newEvents[0].plainContent.endDate) return null;
              else return newEvents;
            } else {
              const event = currentEvents[0];

              /**
               * This part of the code is here to fix a bug that was introduced in the past.
               * The Bug was that the startDate and endDate was the same for some events.
               * This caused the event to be not displayed.
               */

              // Check if corrupted - if not don't import the event again
              if (event.plainContent.startDate < event.plainContent.endDate) {
                return null;
              } else {
                // if corrupted - delete and import again
                await deleteEventByID(event.parentEventID, calendarMetadata.calendarID);
                const decryptedEvent = await DecryptedEventModel.fromParsedICS(
                  parsedEvent,
                  calendarMetadata.calendarID
                );
                return decryptedEvent;
              }
            }
          })
        )
      ).flat();

      const activeCalendarPrivateKey = calendarMetadata.getDecryptedCalendarPrivateKey(
        user.privateUserData.privateKey,
        user.publicKey
      );

      const encryptedEvents: EncryptedEvent[] = [];
      for (const event of events) {
        if (!event) continue;
        try {
          await addUserAttendeeIfNeeded(
            event,
            user,
            calendarMetadata.calendarID,
            event.decryptedContent.attendees.length > 1 ? AttendeeStatus.Pending : AttendeeStatus.Yes
          );
          const attendeesForEncryption = requireAllResolvedAndSplitAttendees(event.decryptedContent.attendees);
          const encryptedEvent = await toEncryptedEvent(
            event,
            calendarMetadata.publicKey,
            activeCalendarPrivateKey,
            attendeesForEncryption
          );
          encryptedEvents.push(encryptedEvent);
        } catch (err) {
          console.error('Error trying to encrypt event', err);
        }
      }

      try {
        await addBulkNewEvents(encryptedEvents.filter(filterExists));
      } catch (err) {
        console.error(err);
      }
    },
    [user]
  );

  const handleFilesUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const acceptedFiles = e.target.files;
      if (!acceptedFiles) return;
      enqueueToast({
        title: 'Import started',
        body: 'Keep the page open until the import is complete.'
      });
      dispatch(importReducer.actions.addActiveImport(ImportType.ICS));
      closeSettings();

      await Promise.all(
        Array.from(acceptedFiles).map(async (file) => {
          switch (file.name.split('.').at(-1)) {
            case 'ics':
              await importIcsFile(file);
              break;
          }
        })
      )
        .then(() => {
          enqueueToast({
            title: 'Import finished',
            body: 'Files successfully imported.'
          });
        })
        .catch((err) => {
          console.error('Import failed', err);
          enqueueToast({
            title: `Import failed`,
            body: (err as { message: string }).message
          });
        });

      dispatch(importReducer.actions.removeActiveImport(ImportType.ICS));
    },
    [dispatch, enqueueToast, importIcsFile]
  );

  if (activeImportTypes.includes(ImportType.ICS)) {
    return (
      <LoadingContainer>
        <CircularProgress size={Size.LARGE} spinner />
      </LoadingContainer>
    );
  }

  return (
    <>
      <ImportSelect
        dataTest='ics-mail-import'
        icon={Icon.PaperClip}
        iconColor='source'
        label='Upload ICS files'
        onClick={() => icsInputRef.current?.click()}
        subLabel='Upload from your local computer'
        wrap
      />
      <input
        accept='.ics'
        multiple={true}
        onChange={(e) => void handleFilesUpload(e)}
        ref={icsInputRef}
        style={{ display: 'none' }}
        type='file'
      />
    </>
  );
};
