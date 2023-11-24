import { useReactiveVar } from '@apollo/client';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';
import { ICalEventStatus } from 'ical-generator';
import {
  Button,
  Dropdown,
  DropdownItem,
  FilledVariant,
  Icon,
  IconButton,
  Icons,
  Portal,
  Size,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Type,
  Typography
} from 'nightwatch-ui';
import { FC, useCallback, useRef, useState } from 'react';
import { DateTimeFormats } from 'skiff-front-utils';
import { generateICS } from 'skiff-ics';
import { v4 } from 'uuid';

import { useCurrentCalendarMetadata } from '../../apollo/currentCalendarMetadata';
import { useSelectedEventState } from '../../apollo/selectedEvent';
import { isDraft } from '../../storage/models/draft/types';
import { ErrorHandlerMetadataDB } from '../../storage/models/ErrorHandlerMetadata';
import { DecryptedEventModel } from '../../storage/models/event/DecryptedEventModel';
import { EmailTypes } from '../../storage/models/event/types';
import { attendeeListToAddresses } from '../../storage/models/EventAttendee';
import { EventsToRecover } from '../../storage/models/EventsToRecover';
import { clearDBOnError } from '../../storage/useSync';
import { syncing } from '../../storage/useSyncVars';
import { getICSMethod } from '../../utils/sync/icsUtils';

const CalendarDebugger: FC = () => {
  const { selectedEvent, diffMap, selectedDraft } = useSelectedEventState();
  const calendarMetadata = useCurrentCalendarMetadata();
  const availableEvent = selectedEvent || selectedDraft;
  const syncState = useReactiveVar(syncing);
  const [showDebugValues, setShowDebugValues] = useState(false);

  const debugValues: { name: string; value: unknown }[] = [
    ...(!!availableEvent
      ? [
          {
            name: 'recurrenceRule',
            value: availableEvent.plainContent.recurrenceRule
          },
          {
            name: 'parentRecurrenceID',
            value: availableEvent.plainContent.parentRecurrenceID
          },
          {
            name: 'recurrenceDate',
            value: availableEvent.plainContent?.recurrenceDate
              ? dayjs(availableEvent.plainContent?.recurrenceDate).format(DateTimeFormats.DayAndMedTime)
              : 'Zero'
          },
          {
            name: 'sequence',
            value: availableEvent.plainContent.sequence
          },
          {
            name: 'updateTypes',
            value: availableEvent.localMetadata.updateType
          },
          {
            name: 'isDraft',
            value: isDraft(availableEvent)
          },
          {
            name: 'diffState',
            value: diffMap?.diffState
          },
          {
            name: 'diff',
            value: diffMap?.diff
          },
          {
            name: 'attendee Diff',
            value: diffMap?.attendeesDiff
          },
          {
            name: 'Local Metadata',
            value: availableEvent.localMetadata
          }
        ]
      : []),
    {
      name: 'calendarID',
      value: calendarMetadata?.calendarID
    },
    {
      name: 'lastUpdated',
      value: dayjs(calendarMetadata?.lastUpdated).format(DateTimeFormats.DayAndMedTime)
    },
    { name: 'global sync state', value: syncState }
  ];

  const actionsButtonRef = useRef<HTMLDivElement | null>(null);
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false);

  const createICS = useCallback(() => {
    if (!selectedEvent) return;

    const currentCalendarAttendee = selectedEvent.decryptedContent.attendees.find(
      (attendee) => attendee.id === calendarMetadata?.calendarID
    );

    if (!currentCalendarAttendee) return;

    const fromAddress = attendeeListToAddresses([currentCalendarAttendee])[0];
    const icsEventStatus = selectedEvent.plainContent.deleted ? ICalEventStatus.CANCELLED : ICalEventStatus.CONFIRMED;
    const icsMethod = getICSMethod(EmailTypes.Update);
    const ics = generateICS(
      DecryptedEventModel.fromDecryptedEvent(selectedEvent).toGenerateEvent(),
      icsEventStatus,
      icsMethod,
      fromAddress.address
    );

    saveAs(new Blob([Buffer.from(ics, 'utf8')], { type: 'text/calendar' }), 'event.ics');
  }, [selectedEvent, calendarMetadata?.calendarID]);

  const debugActions: { action: () => void; tooltip?: string; label: string }[] = [
    {
      label: 'Clear Local DB',
      action: () => {
        void clearDBOnError();
      },
      tooltip:
        'Clears the local database, This is useful for testing the sync process. Note that this will not clear the events from the backend'
    },
    {
      label: 'Clear Local DB, Without Checkpoint',
      action: () => {
        void clearDBOnError(true);
      },
      tooltip: 'Clears the local database, Without updating the checkpoint. So you will not be updated from the backend'
    },
    {
      label: 'Selected Event to ICS',
      action: () => {
        void createICS();
      },
      tooltip: "Creates an ICS file from the selected event, This will always be a 'update' event ics method"
    },
    {
      label: 'Fetch local saved Errors',
      action: () => {
        void (async () => {
          const errors = await ErrorHandlerMetadataDB.getAll();
          const errorsWithDates = errors.map((error) => ({
            ...error,
            date: new Date(error.lastUpdated || 0),
            niceDate: dayjs(error.lastUpdated).format(DateTimeFormats.DayAndMedTime),
            message: error.message.join('\n')
          }));
          console.table(errorsWithDates, ['errorID', 'message', 'count', 'date', 'niceDate']);
        })();
      },
      tooltip: 'Fetches the local saved errors, From dexie'
    },
    {
      label: 'Fetch local events to recover',
      action: () => {
        void (async () => {
          const eventsToRecover = await EventsToRecover.getAll();
          console.table(eventsToRecover, ['parentEventID', 'createdAt', 'tryCount']);
        })();
      },
      tooltip: 'Fetches the local saved errors, From dexie'
    },
    {
      label: 'Create random events to recover',
      action: () => {
        const randomIDs = Array.from({ length: 10 }, () => v4());
        void EventsToRecover.addMany(randomIDs);
        console.log('Created random events to recover', randomIDs);
      },
      tooltip: 'Creates random events to recover, use to test the recovery process'
    }
  ];

  return (
    <Portal>
      <div
        style={{
          zIndex: 9999999,
          position: 'absolute',
          right: 10,
          bottom: 10
        }}
      >
        {showDebugValues && (
          <div
            style={{
              background: 'green',
              opacity: 0.8,
              padding: '20px',
              border: '3px red solid',
              gap: 5,
              maxWidth: '500px',
              overflowY: 'auto',
              maxHeight: '30vh'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Button onClick={() => setShowDebugValues(false)} type={Type.DESTRUCTIVE}>
                Close
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setActionsDropdownOpen(!actionsDropdownOpen);
                }}
                ref={actionsButtonRef}
              >
                Actions
              </Button>
              <Dropdown
                buttonRef={actionsButtonRef}
                portal
                setShowDropdown={setActionsDropdownOpen}
                showDropdown={actionsDropdownOpen}
              >
                <Typography color='tertiary'>Hover for description</Typography>
                {debugActions.map((debugAction) => (
                  <Tooltip key={debugAction.label}>
                    <TooltipContent>{debugAction.tooltip || 'No Description'}</TooltipContent>
                    <TooltipTrigger>
                      <DropdownItem label={debugAction.label} onClick={debugAction.action} />
                    </TooltipTrigger>
                  </Tooltip>
                ))}
              </Dropdown>
            </div>
            {debugValues.map(({ name, value }) => (
              <div key={name}>
                <strong>{name}:</strong>
                <pre
                  style={{
                    flexShrink: 1
                  }}
                >
                  {typeof value === 'string' ? value : JSON.stringify(value, undefined, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
        {!showDebugValues && (
          <IconButton
            icon={<Icons color='green' icon={Icon.Bug} />}
            onClick={() => setShowDebugValues(true)}
            size={Size.LARGE}
            variant={FilledVariant.UNFILLED}
          />
        )}
      </div>
    </Portal>
  );
};

export default CalendarDebugger;
