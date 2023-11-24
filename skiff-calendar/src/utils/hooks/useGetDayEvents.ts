import dayjs, { Dayjs } from 'dayjs';
import { useCallback } from 'react';
import { useLocalSetting, useUserPreference } from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';

import { DisplayEvent } from '../../components/Calendar/types';
import { DATE_UNIT } from '../../constants/time.constants';
import { DecryptedDraft } from '../../storage/models/draft/types';
import { DecryptedEvent } from '../../storage/models/event/types';

/**
 * Returns a utility function that gets events for a single day
 * sorted by start date
 */
export const useGetDayEvents = (eventsInView: (DecryptedEvent | DecryptedDraft)[]) => {
  const [timeZone] = useLocalSetting(StorageTypes.TIME_ZONE);
  const [defaultCalendarColor] = useUserPreference(StorageTypes.DEFAULT_CALENDAR_COLOR);

  const getDayEvents = useCallback(
    (date: Dayjs) => {
      if (!eventsInView) return [];

      const startOfDay = date.startOf(DATE_UNIT);
      const endOfDay = date.endOf(DATE_UNIT);

      const events: DisplayEvent[] = [];
      for (const event of eventsInView) {
        const eventStart = dayjs(event.plainContent.startDate);
        const eventEnd = dayjs(event.plainContent.endDate);

        if (eventEnd.isBefore(startOfDay)) continue;
        else if (eventStart.isAfter(endOfDay)) {
          // Events are sorted by start date
          // If the startDate is after the endOfDay, we can ignore all events after that
          return events;
        }

        // Event starts before the current day
        const startBefore = eventStart.isBefore(startOfDay);
        // Events ends after the current day
        const endsAfter = eventEnd.isAfter(endOfDay);

        events.push({
          ...event,
          color: event.decryptedPreferences?.color ?? defaultCalendarColor,
          displayStartDate: startBefore ? startOfDay.valueOf() : event.plainContent.startDate,
          displayEndDate: endsAfter ? endOfDay.valueOf() : event.plainContent.endDate,
          isSplitDisplayEvent: endsAfter || startBefore,
          isFirstDisplayedEvent: !startBefore,
          isLastDisplayedEvent: !endsAfter
        });
      }
      return events;
    },
    // Adding timezone here to make sure the events are updated when the timezone changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultCalendarColor, eventsInView, timeZone]
  );

  return getDayEvents;
};
