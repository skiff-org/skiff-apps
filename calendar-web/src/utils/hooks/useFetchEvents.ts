import { useEffect, useState } from 'react';

import {
  draftQuery,
  periodEventQuery,
  recurringParentsQuery,
  useDexieLiveQuery,
  useUpdateDexieQueries
} from '../../storage/db/dexie/utils';
import { DecryptedDraft } from '../../storage/models/draft/types';
import { DecryptedEvent } from '../../storage/models/event/types';
import { getStartOfDateInUTC } from '../dateTimeUtils';

import { getAllDayEventsForDaysRange, getEventsForDaysRange } from './useEvents';
import { useGetFirstAndLastDayInView } from './useGetFirstAndLastDayInView';

export const useFetchEvents = () => {
  const { firstDay, numDaysToShow } = useGetFirstAndLastDayInView();

  // Update Dexie Queries
  useUpdateDexieQueries({ firstDay, daysToShow: numDaysToShow });

  // Querying
  const weeklyEvents = useDexieLiveQuery(periodEventQuery);
  const recurringParents = useDexieLiveQuery(recurringParentsQuery);
  const allDrafts = useDexieLiveQuery(draftQuery);

  const [timedEventsInView, setTimedEventsInView] = useState<(DecryptedEvent | DecryptedDraft)[]>([]);
  const [allDayEventsInView, setAllDayEventsInView] = useState<DecryptedDraft[][]>([]);

  useEffect(() => {
    // Get all timed events in a specific day range
    const timedEvents = getEventsForDaysRange(
      weeklyEvents ?? [],
      allDrafts ?? [],
      recurringParents ?? [],
      firstDay,
      numDaysToShow
    );

    // Get all all-day events in a specific day range
    const allDayEvents = getAllDayEventsForDaysRange(
      weeklyEvents ?? [],
      allDrafts ?? [],
      recurringParents ?? [],
      getStartOfDateInUTC(firstDay),
      numDaysToShow
    );

    setTimedEventsInView(timedEvents);
    setAllDayEventsInView(allDayEvents);
  }, [allDrafts, firstDay, numDaysToShow, recurringParents, weeklyEvents]);

  return { timedEventsInView, allDayEventsInView };
};
