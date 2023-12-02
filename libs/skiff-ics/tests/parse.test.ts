import fs from 'fs';
import path from 'path';

import dayjs from 'dayjs';
import { RecurrenceFrequency } from 'skiff-graphql';
import { assertExists } from 'skiff-utils';

import { parseICS } from '../src';
import { removeQuotes } from '../src/parse';

enum TestFilePaths {
  Invite1 = 'example-ics/invite-1.ics',
  Invite2 = 'example-ics/skalendar.ics',
  EventWithGMTTimezone = 'example-ics/gmt-timezone.ics',
  RecurrenceDaily = 'example-ics/recurrence/daily-30.ics',
  RecurrenceDailyWithSingleChange = 'example-ics/recurrence/daily-30-single-changed-event.ics'
}

describe('parse ICS', () => {
  test('parse event invite', () => {
    const content = fs.readFileSync(path.join(__dirname, TestFilePaths.Invite1), 'utf-8');
    const parsedICS = parseICS(content);

    const events = parsedICS.events;
    expect(events.length).toBe(1);
    const inviteEvent = events[0];
    assertExists(inviteEvent);
    expect(inviteEvent.id).toBe('65qq3t0ji5u0bl8q37b7uqkmdj@google.com');
  });
  test('parse skalendar event invite', () => {
    const content = fs.readFileSync(path.join(__dirname, TestFilePaths.Invite2), 'utf-8');
    const parsedICS = parseICS(content);

    const events = parsedICS.events;
    expect(events.length).toBe(1);
    const inviteEvent = events[0];
    assertExists(inviteEvent);
    // attendees names should be without quotes
    const [chai, jason] = inviteEvent.attendees.sort((a, b) => a.name.localeCompare(b.name));
    assertExists(chai);
    assertExists(jason);
    expect(jason.name).toBe('Jason');
    expect(chai.name).toBe('cpedada@skiff.org');
  });
  test('remove quotes', () => {
    // should remove quotes from start and end of string
    const name = 'Jason';
    expect(removeQuotes(`"${name}"`)).toBe(name);
    // should not remove quotes not at start and end of string
    const quoteNotAtStart = `T"est"`;
    expect(quoteNotAtStart).toBe(quoteNotAtStart);
  });
  test('parse event with GMT+0100 TZID', () => {
    const content = fs.readFileSync(path.join(__dirname, TestFilePaths.EventWithGMTTimezone), 'utf-8');
    const parsedICS = parseICS(content);

    const allEvents = parsedICS.events;
    expect(allEvents.length).toBe(1);
    const event = allEvents[0];
    assertExists(event);
    expect(event.id).toBe('5ADA988D-440A-42FE-956E-49BB15AAD916');
    // start date in ICS file is 20230207T183000, expected should be an earlier later given timezone is GMT+0100
    expect(dayjs('2023-02-07T17:30:00.000Z').utc().isSame(event.startDate.utc())).toBe(true);
  });
});

describe('parse Recurrence Event ICS', () => {
  test('simple 30 days dayly event', () => {
    const content = fs.readFileSync(path.join(__dirname, TestFilePaths.RecurrenceDaily), 'utf-8');
    const parsedICS = parseICS(content);

    expect(parsedICS.events.length).toBe(1);
    const event = parsedICS.events[0];

    expect(event).toBeDefined();
    expect(event?.recurrenceRule).toBeDefined();
    expect(event?.recurrenceRule?.frequency).toBe(RecurrenceFrequency.Daily);
    expect(event?.recurrenceRule?.count).toBe(30);
  });

  test('simple 30 days dayly event with single changed instance', () => {
    const content = fs.readFileSync(path.join(__dirname, TestFilePaths.RecurrenceDailyWithSingleChange), 'utf-8');
    const parsedICS = parseICS(content);

    expect(parsedICS.events.length).toBe(1);
    const event = parsedICS.events[0];

    expect(event).toBeDefined();
    expect(event?.title).toBe('Every Day');

    expect(event?.recurrenceRule).toBeDefined();
    expect(event?.recurrenceRule?.frequency).toBe(RecurrenceFrequency.Daily);
    expect(event?.recurrenceRule?.count).toBe(30);

    expect(event?.recurrences?.length).toBe(1);
    const recurrenceEvent = event?.recurrences?.[0];

    expect(recurrenceEvent).toBeDefined();
    expect(recurrenceEvent?.title).toBe('Every Day Changed Title');

    const icsTimezone = 'Asia/Jerusalem';
    expect(recurrenceEvent?.startDate.toString()).toBe(dayjs.tz('20221217T130000', icsTimezone).toString());
    expect(recurrenceEvent?.endDate.toString()).toBe(dayjs.tz('20221217T140000', icsTimezone).toString());
  });
});
