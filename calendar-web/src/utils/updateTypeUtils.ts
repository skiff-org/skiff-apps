import { EventUpdateType } from 'skiff-graphql';

/**
 * Returns true if we are only updating the RSVP of an event
 * @param updateType The updates made to an event
 * @returns boolean indicating whether or not we are only updating the RSVP of an event
 */
export const isOnlyRSVPUpdate = (updateType: EventUpdateType[]) =>
  updateType.length === 1 && updateType.includes(EventUpdateType.Rsvp);
