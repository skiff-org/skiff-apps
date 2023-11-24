import { makeVar, useReactiveVar } from '@apollo/client';
import { assertExists } from 'skiff-utils';

import { CalendarMetadataDB } from '../storage/models/CalendarMetadata';

const currentCalendarMetadata = makeVar<CalendarMetadataDB | null>(null);

export const saveCurrentCalendarMetadata = (data: CalendarMetadataDB | null) => {
  currentCalendarMetadata(data);
};

export const removeCurrentCalendarMetadata = () => {
  currentCalendarMetadata(null);
};

export const getCurrentCalendarMetadata = async () => {
  let calendarMetadata = currentCalendarMetadata();

  // if the var is still not defined try to get it from the db and update the var
  if (!calendarMetadata) {
    calendarMetadata = await CalendarMetadataDB.getMetadata();
    if (calendarMetadata) saveCurrentCalendarMetadata(calendarMetadata);
  }

  return calendarMetadata;
};

export const requireCurrentCalendarMetadata = async () => {
  const calendarMetadata = await getCurrentCalendarMetadata();
  assertExists(calendarMetadata, 'Calendar metadata does not exist');
  return calendarMetadata;
};

export const useCurrentCalendarMetadata = () => useReactiveVar(currentCalendarMetadata);

const currentCalendarID = makeVar<string | null>(null);

export const saveCurrentCalendarID = (data: string | null) => {
  currentCalendarID(data);
};

export const removeCurrentCalendarID = () => {
  currentCalendarID(null);
};

export const getCurrentCalendarID = () => currentCalendarID();

export const requireCurrentCalendarID = () => {
  const calendarID = currentCalendarID();
  assertExists(calendarID, 'Calendar ID does not exist');
  return calendarID;
};

export const useCurrentCalendarID = () => useReactiveVar(currentCalendarID);

export const useRequiredCurrentCalendarID = () => {
  const calendarID = useReactiveVar(currentCalendarID);
  assertExists(calendarID, 'Calendar ID does not exist');
  return calendarID;
};
