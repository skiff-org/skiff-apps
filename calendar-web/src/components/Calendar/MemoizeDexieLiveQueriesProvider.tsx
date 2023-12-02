import { useLiveQuery } from 'dexie-react-hooks';
import React, { FC, useEffect } from 'react';

import {
  getCurrentCalendarID,
  saveCurrentCalendarID,
  saveCurrentCalendarMetadata
} from '../../apollo/currentCalendarMetadata';
import { EventDiffState, setSelectedEventDiffState, setSelectedEventState } from '../../apollo/selectedEvent';
import { CalendarMetadataDB } from '../../storage/models/CalendarMetadata';
import { getDraftByID } from '../../storage/models/draft/modelUtils';
import { DecryptedEventModel } from '../../storage/models/event/DecryptedEventModel';
import { getEventByID } from '../../storage/models/event/modelUtils';
import { getEventDraftDiff } from '../../utils/eventUtils';
import { useAppSelector } from '../../utils/hooks/useAppSelector';
import { isRecurringParent } from '../../utils/recurringUtils';

/**
 * This provider is used to populate the reactiveVars:
 * 1. selectedEvent
 * 2. selectedDraft
 * 3. calendar metadata
 * 4. calendar ID
 *
 * So that we will not need to have the live query in many components
 * Also we do here the diff calculation
 */
const MemoizeDexieLiveQueriesProvider: FC = ({ children }) => {
  const selectedEventID = useAppSelector((state) => state.event.selectedEventID);
  const calendarMetadata = useLiveQuery(() => CalendarMetadataDB.getMetadata(), []) || null;

  // TODO separate this into 2 different live queries
  const [selectedEvent, selectedDraft, parentRecurringEvent] = useLiveQuery(async () => {
    if (!selectedEventID) return [undefined, undefined, undefined];
    const event = await getEventByID(selectedEventID);
    const draft = await getDraftByID(selectedEventID);

    let parent: DecryptedEventModel | null = null;
    if (event && isRecurringParent(event)) {
      parent = event;
    } else {
      const parentRecurrenceID = draft?.plainContent.parentRecurrenceID || event?.plainContent.parentRecurrenceID;
      parent = (await getEventByID(parentRecurrenceID ?? '')) ?? null;
    }

    return [event, draft, parent];
  }, [selectedEventID]) || [undefined, undefined, undefined];

  useEffect(() => {
    const diff = selectedDraft && getEventDraftDiff(selectedEvent, selectedDraft);
    setSelectedEventState({
      selectedEvent: selectedEvent ?? null,
      selectedDraft: selectedDraft ?? null,
      parentRecurringEvent: parentRecurringEvent ?? null,
      diffMap: diff ?? undefined
    });
    setSelectedEventDiffState(diff?.diffState ?? EventDiffState.Settled);
  }, [selectedEvent, selectedDraft, selectedEventID, parentRecurringEvent]);

  useEffect(() => {
    saveCurrentCalendarMetadata(calendarMetadata);
    if (getCurrentCalendarID() !== calendarMetadata?.calendarID) {
      saveCurrentCalendarID(calendarMetadata?.calendarID || null);
    }
  }, [calendarMetadata]);

  const memoizedChildren = React.useMemo(() => children, [children]);

  return <>{memoizedChildren}</>;
};

export default MemoizeDexieLiveQueriesProvider;
