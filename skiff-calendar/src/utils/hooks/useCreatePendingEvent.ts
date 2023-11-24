import { Dayjs } from 'dayjs';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useToast, useRequiredCurrentUserData } from 'skiff-front-utils';

import { useCurrentCalendarMetadata } from '../../apollo/currentCalendarMetadata';
import { DAY_UNIT } from '../../constants/time.constants';
import { eventReducer } from '../../redux/reducers/eventReducer';
import { saveDraft } from '../../storage/models/draft/modelUtils';
import { generateNewDraft } from '../../storage/models/draft/utils';
import { getStartDateWithRoundedTime } from '../dateTimeUtils';

import { useAppSelector } from './useAppSelector';
import { useGetUserProfileData } from './useGetUserProfileData';

export const useCreatePendingEvent = (isAllDay: boolean) => {
  const dispatch = useDispatch();
  const { userID, defaultEmailAlias } = useRequiredCurrentUserData();
  const { currentTime, selectedViewDate } = useAppSelector((state) => state.time);
  const { displayName } = useGetUserProfileData(userID);
  const { enqueueToast } = useToast();

  const calendarMetadata = useCurrentCalendarMetadata();

  const createPendingEvent = useCallback(
    async (customStartDate?: Dayjs, parentEventID?: string, endDate?: Dayjs) => {
      // Timed event default start date at time rounded to the next half hour of the current time
      const timedEventStartDate = getStartDateWithRoundedTime(selectedViewDate, currentTime);
      // All day event default start date
      const allDayEventStartDate = selectedViewDate.utc(true).startOf(DAY_UNIT);
      // If no custom start date is passed, create event on selected view date based at time based on the event type
      const defaultStartDate = isAllDay ? allDayEventStartDate : timedEventStartDate;
      const startDate = customStartDate ?? defaultStartDate;
      if (!calendarMetadata || !defaultEmailAlias) {
        enqueueToast({ title: 'Could not create event', body: 'Try saving the event again.' });
        return;
      }

      const newDraft = generateNewDraft({
        startDate: startDate,
        endDate: endDate,
        // TODO(easdar) Assumes we are using the primary calendar always.
        calendar: calendarMetadata,
        parentEventID: parentEventID,
        email: defaultEmailAlias,
        displayName,
        isAllDay
      });

      // save the draft in the drafts table so it can be queried
      await saveDraft(newDraft);

      // set the selectedEventID to the draft id to show it on the sidebar and the event content state to new
      dispatch(eventReducer.actions.setSelectedEventID({ eventID: newDraft.parentEventID }));
    },
    [calendarMetadata, currentTime, defaultEmailAlias, dispatch, displayName, enqueueToast, isAllDay, selectedViewDate]
  );
  return createPendingEvent;
};
