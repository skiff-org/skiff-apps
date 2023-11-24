import dayjs from 'dayjs';
import { AttendeeStatus, CalendarMethodTypes, CalendarUserTypes, EventStatus, ParsedEvent } from 'skiff-ics';

export const parsedEventWithExternalOrganizer: ParsedEvent = {
  id: '65qq3t0ji5u0bl8q37b7uqkmdj@google.com',
  startDate: dayjs('2022-09-22T13:00:00.000Z'),
  endDate: dayjs('2022-09-22T14:00:00.000Z'),
  icsCreationDate: dayjs('2022-09-21T12:56:17.000Z'),
  creationDate: dayjs('2022-09-21T12:54:41.000Z'),
  lastModifiedDate: dayjs('2022-09-21T12:56:15.000Z'),
  organizer: { name: 'externalUser@gmail.com', value: 'mailto:externalUser@gmail.com' },
  attendees: [
    {
      name: 'externalUser@gmail.com',
      value: 'mailto:externalUser@gmail.com',
      email: 'externalUser@gmail.com',
      role: 'REQ-PARTICIPANT',
      status: AttendeeStatus.Accepted,
      rsvp: false,
      calendarUserType: CalendarUserTypes.Individual
    },
    {
      name: 'internalUser@skiff.town',
      value: 'mailto:internalUser@skiff.town',
      email: 'internalUser@skiff.town',
      role: 'REQ-PARTICIPANT',
      status: AttendeeStatus.NeedActions,
      rsvp: false,
      calendarUserType: CalendarUserTypes.Individual
    }
  ],
  description: 'This is a description',
  location: '',
  title: 'Example event',
  status: EventStatus.Confirmed,
  method: CalendarMethodTypes.Publish,
  sequence: 0
};

export const parsedEventWithoutOrganizer = {
  id: '65qq3t0ji5u0bl8q37b7uqkmdj@google.com',
  startDate: dayjs('2022-09-22T13:00:00.000Z'),
  endDate: dayjs('2022-09-22T14:00:00.000Z'),
  icsCreationDate: dayjs('2022-09-21T12:56:17.000Z'),
  creationDate: dayjs('2022-09-21T12:54:41.000Z'),
  lastModifiedDate: dayjs('2022-09-21T12:56:15.000Z'),
  organizer: undefined,
  attendees: [
    {
      name: 'externalUser@gmail.com',
      value: 'mailto:externalUser@gmail.com',
      email: 'externalUser@gmail.com',
      role: 'REQ-PARTICIPANT',
      status: 'ACCEPTED',
      rsvp: false,
      calendarUserType: 'INDIVIDUAL'
    },
    {
      name: 'internalUser@skiff.town',
      value: 'mailto:internalUser@skiff.town',
      email: 'internalUser@skiff.town',
      role: 'REQ-PARTICIPANT',
      status: 'NEEDS-ACTION',
      rsvp: false,
      calendarUserType: 'INDIVIDUAL'
    }
  ],
  description: 'This is a description',
  location: '',
  title: 'Example event',
  status: 'CONFIRMED'
} as ParsedEvent;

export const parsedEventWithoutOrganizerInAttendees = {
  id: '65qq3t0ji5u0bl8q37b7uqkmdj@google.com',
  startDate: dayjs('2022-09-22T13:00:00.000Z'),
  endDate: dayjs('2022-09-22T14:00:00.000Z'),
  icsCreationDate: dayjs('2022-09-21T12:56:17.000Z'),
  creationDate: dayjs('2022-09-21T12:54:41.000Z'),
  lastModifiedDate: dayjs('2022-09-21T12:56:15.000Z'),
  organizer: { name: 'externalUser@gmail.com', value: 'mailto:externalUser@gmail.com' },
  attendees: [
    {
      name: 'internalUser@skiff.town',
      value: 'mailto:internalUser@skiff.town',
      email: 'internalUser@skiff.town',
      role: 'REQ-PARTICIPANT',
      status: 'NEEDS-ACTION',
      rsvp: false,
      calendarUserType: 'INDIVIDUAL'
    }
  ],
  description: 'This is a description',
  location: '',
  title: 'Example event',
  status: 'CONFIRMED'
} as ParsedEvent;
