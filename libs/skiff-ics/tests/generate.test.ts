import { ICalCalendarMethod, ICalEventStatus } from 'ical-generator';
import { AttendeePermission, AttendeeStatus } from 'skiff-graphql';

import { generateICS } from '../src/generate';

describe('test generate ICS', () => {
  jest.useFakeTimers().setSystemTime(new Date('2021-01-01'));
  it('should generate ICS', () => {
    const ics = generateICS(
      {
        title: 'test',
        description: 'test',
        location: 'test',
        sequence: 0,
        startDate: new Date('2021-01-01').getTime(),
        endDate: new Date('2021-01-02').getTime(),
        externalID: 'abcd',
        attendees: [
          {
            attendeeStatus: AttendeeStatus.Yes,
            permission: AttendeePermission.Owner,
            displayName: 'foo',
            optional: false,
            email: 'foo@skiff.town'
          },
          {
            attendeeStatus: AttendeeStatus.Yes,
            permission: AttendeePermission.Owner,
            displayName: 'bar',
            optional: false,
            email: 'bar@skiff.org'
          }
        ],
        updatedAt: new Date('2021-01-01').getTime()
      },
      ICalEventStatus.CONFIRMED,
      ICalCalendarMethod.REQUEST,
      'foo@skiff.town'
    );
    expect(ics).toMatchSnapshot();
  });
});
