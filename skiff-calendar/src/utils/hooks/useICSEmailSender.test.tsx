import 'fake-indexeddb/auto';
import every from 'lodash/every';
import { generatePublicPrivateKeyPair } from 'skiff-crypto';
import { EncryptMessageRequest } from 'skiff-front-graphql';
import { AttendeePermission, AttendeeStatus, EventUpdateType, SendEmailRequest } from 'skiff-graphql';
import { assertExists } from 'skiff-utils';

import { createRandomInternalAttendee } from '../../../tests/fixture/event';
import { plainMockEvent } from '../../../tests/mocks/encryptedEvent';
import { generateCurrentUserEmailAliasesResponse, generateMockUser } from '../../../tests/mocks/user';
import { currentUserAliasesFactory, mswServer } from '../../../tests/mockServer';
import { initializeTestDB } from '../../../tests/utils/db';
import { db } from '../../storage/db/db';
import { CalendarMetadataDB } from '../../storage/models/CalendarMetadata';
import { DecryptedEventModel } from '../../storage/models/event/DecryptedEventModel';
import * as modelUtils from '../../storage/models/event/modelUtils';
import { DecryptedEvent, EmailContentType, EmailTypes, EventSyncState } from '../../storage/models/event/types';
import { sendEmailWithUpload } from '../sync/emailUtils';

import { sendICSEmails } from './useICSEmailSender';

const { deleteEventByID, getEventByID, getEventsThatShouldSendMail, saveContent } = modelUtils;

const ownerKeypair = generatePublicPrivateKeyPair();
const ownerAttendee = createRandomInternalAttendee(AttendeePermission.Owner, ownerKeypair.publicKey, 'eventOwner');
const ownerUserObject = generateMockUser(ownerKeypair, 'owner', ownerAttendee.calendarID);

jest.mock('skiff-front-utils', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const original = jest.requireActual('skiff-front-utils');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...original,
    getCurrentUserData: () => ownerUserObject,
    requireCurrentUserData: () => ownerUserObject
  };
});

jest.mock('skiff-front-graphql', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalModule = jest.requireActual('skiff-front-graphql');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    __esModule: true,
    ...originalModule,
    encryptMessage: jest.fn((request: EncryptMessageRequest, _client: unknown) => ({
      encryptedSubject: request.messageSubject,
      encryptedText: request.messageTextBody,
      encryptedHtml: request.messageHtmlBody,
      encryptedTextAsHtml: request.messageTextBody,
      encryptedAttachments: request.attachments,
      fromAddressWithEncryptedKey: request.fromAddress,
      toAddressesWithEncryptedKeys: request.toAddresses,
      ccAddressesWithEncryptedKeys: request.ccAddresses,
      bccAddressesWithEncryptedKeys: request.bccAddresses
    }))
  };
});

// Mock sendEmailWithUpload manully instead of using msw because: https://github.com/mswjs/msw/issues/611
const sendEmailmock = jest.fn<typeof sendEmailWithUpload, [SendEmailRequest]>();

jest.mock('../sync/emailUtils', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalModule = jest.requireActual('../sync/emailUtils');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    __esModule: true,
    ...originalModule,
    sendEmailWithUpload: (req: SendEmailRequest) => {
      sendEmailmock(req);
      return {};
    }
  };
});

jest.mock('../../redux/store/reduxStore', () => ({
  getState: () => ({
    calendar: {
      requestHCaptchaTokenRef: () => Promise.resolve('Token')
    }
  })
}));

const mockCalendarMetadata = CalendarMetadataDB.fromMetadata({
  calendarID: ownerAttendee.calendarID,
  publicKey: '',
  encryptedPrivateKey: '',
  initializedLocalDB: true,
  encryptedByKey: ''
});

jest.mock('../../apollo/currentCalendarMetadata', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalModule = jest.requireActual('../../apollo/currentCalendarMetadata');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    __esModule: true,
    ...originalModule,
    getCurrentCalendarID: () => ownerAttendee.calendarID,
    requireCurrentCalendarID: () => ownerAttendee.calendarID,
    getCurrentCalendarMetadata: () => mockCalendarMetadata,
    requireCurrentCalendarMetadata: () => mockCalendarMetadata
  };
});

const shouldEventSendMail = (event: DecryptedEvent) =>
  event.localMetadata.currentMailTimestamp < event.localMetadata.requestMailTimestamp;

describe('send invite/update/delete emails with ics', () => {
  beforeEach(async () => {
    await initializeTestDB(ownerKeypair.publicKey, ownerKeypair.publicKey, ownerAttendee.calendarID);
  });

  afterEach(async () => {
    await db?.delete();
    sendEmailmock.mockClear();
  });

  it('will send invite email to user when first added to event', async () => {
    const user1 = createRandomInternalAttendee(AttendeePermission.Read, 'pk', 'user1', { isNew: true });
    const event = DecryptedEventModel.fromDecryptedEvent(DecryptedEventModel.fromDecryptedEvent(plainMockEvent({})));
    // Set event attendees to owner + user1
    event.decryptedContent.attendees = [ownerAttendee, user1];
    event.markAsNeedToSendMail(ownerAttendee.calendarID, [EmailContentType.Content]);
    await saveContent(event, false, EventSyncState.Done);

    await sendICSEmails();

    // Expect only 1 mail to be sent
    expect(sendEmailmock.mock.calls.length).toBe(1);

    const firstInviteMail = sendEmailmock.mock.calls[0][0];

    // Make sure mail sent from owner
    expect(firstInviteMail.from.address).toBe(ownerAttendee.email);
    // Mail should only be sent to user1
    expect(firstInviteMail.to.length).toBe(1);
    expect(firstInviteMail.to[0].address).toBe(user1.email);
    // Mail should include 1 attachment (ics)
    expect(firstInviteMail.attachments.length).toBe(1);
    // Subject should be invite subject
    expect(firstInviteMail.rawSubject).toBe(
      `${event.decryptedContent.attendees[0].displayName ?? ''} invited you to a new event: ${
        event.decryptedContent.title
      }`
    );
    // Event should not need to send mail
    const updatedEvent = await getEventByID(event.parentEventID);
    assertExists(updatedEvent);
    expect(shouldEventSendMail(updatedEvent)).toBe(false);
    // Event attendees should be marked as not new
    expect(every(updatedEvent?.decryptedContent.attendees.map((att) => att.isNew))).toBe(false);
  });

  it('will send invite to new attendee and update to existing attendee', async () => {
    const user1 = createRandomInternalAttendee(AttendeePermission.Read, 'PK', 'user1', { isNew: false });
    const user2 = createRandomInternalAttendee(AttendeePermission.Read, 'PK', 'user2', { isNew: true });
    const event = DecryptedEventModel.fromDecryptedEvent(DecryptedEventModel.fromDecryptedEvent(plainMockEvent({})));
    // Add new attendee
    event.decryptedContent.attendees = [ownerAttendee, user1, user2];
    event.markAsNeedToSendMail(ownerAttendee.calendarID, [EmailContentType.Content]);
    await saveContent(event, false, EventSyncState.Done);
    await sendICSEmails();

    // Expect 2 mail to be sent (invite + update)
    expect(sendEmailmock.mock.calls.length).toBe(2);
    const emailsSent = sendEmailmock.mock.calls.flatMap((call) => call);
    expect(emailsSent.length).toBe(2);
    const inviteMail = emailsSent.find((email) => email.rawSubject.includes('invite'));
    const updateMail = emailsSent.find((email) => email.rawSubject.includes('update'));
    // Should have invite mail and update mail
    assertExists(inviteMail);
    assertExists(updateMail);
    // Invite should have been sent to user 2
    expect(inviteMail.to[0].address).toBe(user2.email);
    // Update should have been sent to user 1
    expect(updateMail.to[0].address).toBe(user1.email);

    expect(updateMail.rawSubject).toBe(
      `${event.decryptedContent.attendees[0].displayName ?? ''} updated the event: ${event.decryptedContent.title}`
    );

    // Event should not be marked as need to send
    const updatedEvent = await getEventByID(event.parentEventID);
    assertExists(updatedEvent);
    expect(shouldEventSendMail(updatedEvent)).toBe(false);
    expect(updatedEvent.localMetadata.eventEmails.sent).toEqual([]);
    expect(updatedEvent.localMetadata.eventEmails.queue).toEqual([]);
    // Event attendees should be marked as not new
    expect(every(updatedEvent?.decryptedContent.attendees.map((att) => att.isNew))).toBe(false);
  });

  it('will send same mail to multiple attendees', async () => {
    const user1 = createRandomInternalAttendee(AttendeePermission.Read, 'PK', 'user1');
    const user2 = createRandomInternalAttendee(AttendeePermission.Read, 'PK', 'user2');
    const event = DecryptedEventModel.fromDecryptedEvent(plainMockEvent({}));
    // Set event attendees to owner + user1
    event.decryptedContent.attendees = [ownerAttendee, user1, user2];
    event.markAsNeedToSendMail(ownerAttendee.calendarID, [EmailContentType.Content]);
    await saveContent(event, false, EventSyncState.Done);
    await sendICSEmails();

    // Expect only 1 mail to be sent
    expect(sendEmailmock.mock.calls.length).toBe(1);

    const mailSent = sendEmailmock.mock.calls[0][0];

    // Mail should be sent to user1 and user 2
    expect(mailSent.to.length).toBe(2);
    expect(mailSent.to.map((to) => to.address)).toEqual([user1.email, user2.email]);
  });

  it('will send deletion email', async () => {
    const user1 = createRandomInternalAttendee(AttendeePermission.Read, 'PK', 'user1');
    const event = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        plainContent: {
          creatorCalendarID: ownerAttendee.calendarID
        }
      })
    );
    // Set event attendees to owner + user1
    event.decryptedContent.attendees = [ownerAttendee, user1];
    await saveContent(event);

    await deleteEventByID(event.parentEventID, ownerAttendee.calendarID);
    event.markAsNeedToSendMail(ownerAttendee.calendarID, [EmailContentType.Content]);
    await saveContent(event, false, EventSyncState.Done);
    await sendICSEmails();

    // Expect only 1 mail to be sent
    expect(sendEmailmock.mock.calls.length).toBe(1);

    const mailSent = sendEmailmock.mock.calls[0][0];

    // Mail should be deletion email
    expect(mailSent.to.length).toBe(1);
    expect(mailSent.rawSubject).toBe(`${event.decryptedContent.attendees[0].displayName ?? ''} has deleted the event`);
  });

  it('will send RSVP email', async () => {
    const eventOwner = createRandomInternalAttendee(AttendeePermission.Owner, 'PK', 'user1');
    const currentUser = createRandomInternalAttendee(
      AttendeePermission.Read,
      ownerKeypair.publicKey,
      ownerAttendee.calendarID
    );

    const event = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        plainContent: { creatorCalendarID: eventOwner.id }
      })
    );
    // Set event attendees to eventOwner + currentUser
    event.decryptedContent.attendees = [eventOwner, currentUser];
    event.updateAttendee(currentUser.calendarID, { attendeeStatus: AttendeeStatus.Yes });

    event.addToUpdateType([EventUpdateType.Rsvp]);
    event.markAsNeedToSendMail(currentUser.calendarID, [EmailContentType.Rsvp]);
    await saveContent(event, false, EventSyncState.Done);

    // mock request to get all users aliases to return only the new alias
    mswServer.use(currentUserAliasesFactory(generateCurrentUserEmailAliasesResponse(ownerUserObject)));

    await sendICSEmails();

    // Expect only 1 mail to be sent
    expect(sendEmailmock.mock.calls.length).toBe(1);

    const mailSent = sendEmailmock.mock.calls[0][0];

    // Mail should be deletion email
    expect(mailSent.to.length).toBe(1);
    expect(mailSent.rawSubject).toContain('Accepted');

    const updatedEvent = await getEventByID(event.parentEventID);
    assertExists(updatedEvent);
    expect(shouldEventSendMail(updatedEvent)).toBe(false);
    expect(updatedEvent.localMetadata.eventEmails.sent).toEqual([]);
    expect(updatedEvent.localMetadata.eventEmails.queue).toEqual([]);
  });

  it('will not send RSVP email to self', async () => {
    const eventOwner = createRandomInternalAttendee(
      AttendeePermission.Owner,
      ownerKeypair.publicKey,
      ownerAttendee.calendarID
    );
    const anotherInternal = createRandomInternalAttendee(
      AttendeePermission.Read,
      ownerKeypair.publicKey,
      'anotherInternal'
    );
    const anotherExternal = createRandomInternalAttendee(AttendeePermission.Read, 'anotherExternal');
    const event = DecryptedEventModel.fromDecryptedEvent(
      plainMockEvent({
        plainContent: {
          creatorCalendarID: eventOwner.id
        }
      })
    );

    // Set event attendees to eventOwner + currentUser
    event.decryptedContent.attendees = [eventOwner, anotherExternal, anotherInternal];
    event.updateAttendee(eventOwner.calendarID, { attendeeStatus: AttendeeStatus.Yes });
    event.addToUpdateType([EventUpdateType.Rsvp]);
    event.markAsNeedToSendMail(eventOwner.calendarID, [EmailContentType.Rsvp]);
    expect(shouldEventSendMail(event)).toBe(false);
    await saveContent(event, false, EventSyncState.Done);
    await sendICSEmails();
    expect(sendEmailmock.mock.calls.length).toBe(0);
  });

  it('can handle email send failure and send mail again in next interval', async () => {
    // Mock sendEmailWithUpload to intentionally fail when sending update email
    const failOnUpdate = (req: SendEmailRequest) => {
      if (req.rawSubject.includes('update')) throw new Error('failed to send');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return req as any;
    };
    sendEmailmock.mockImplementationOnce(failOnUpdate).mockImplementationOnce(failOnUpdate);
    // Create an event where we need to send invite + update mail
    const user1 = createRandomInternalAttendee(AttendeePermission.Read, 'PK', 'user1', { isNew: false });
    const user2 = createRandomInternalAttendee(AttendeePermission.Read, 'PK', 'user2', { isNew: true });
    const event = DecryptedEventModel.fromDecryptedEvent(plainMockEvent({}));

    event.decryptedContent.attendees = [ownerAttendee, user1, user2];
    event.markAsNeedToSendMail(ownerAttendee.calendarID, [EmailContentType.Content]);
    await saveContent(event, false, EventSyncState.Done);
    await sendICSEmails();

    // Make sure that invite was sent and that update was not

    // Expect only 2 send email calls
    expect(sendEmailmock.mock.calls.length).toBe(2);
    // Expect one call to have return and other to be fail
    const failedResults = sendEmailmock.mock.results.filter((res) => res.type === 'throw');
    const successfulResults = sendEmailmock.mock.results.filter((res) => res.type === 'return');
    expect(failedResults.length).toBe(1);
    expect(successfulResults.length).toBe(1);

    // Expect the successful call to be invite email
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    expect(successfulResults[0].value.rawSubject.includes('invite')).toBeTruthy();
    // Successful mail should have been sent to user2
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    expect(successfulResults[0].value.to[0].address).toBe(user2.email);

    // Get event from db
    const updatedEvent = await getEventByID(event.parentEventID);
    expect(updatedEvent).toBeDefined();

    // Event must still send mail
    assertExists(updatedEvent);
    expect(shouldEventSendMail(updatedEvent)).toBe(true);
    // Event must has invite inside sent
    expect(updatedEvent?.localMetadata.eventEmails.sent.join()).toBe(EmailTypes.Invite);

    // Now we will run the sendICSEmail again and we expect ONLY update to be sent
    sendEmailmock.mockClear();

    await sendICSEmails();

    // Expect only 1 mail to be sent
    expect(sendEmailmock.mock.calls.length).toBe(1);

    const emailSent = sendEmailmock.mock.calls[0][0];

    // Make sure mail sent was update
    expect(emailSent.rawSubject.includes('update')).toBeTruthy();
    // Update mail should've been sent to user1
    expect(emailSent.to[0].address).toBe(user1.email);
    // Event should not be marked as need to send
    const finalUpdatedEvent = await getEventByID(event.parentEventID);
    assertExists(finalUpdatedEvent);
    expect(shouldEventSendMail(finalUpdatedEvent)).toBe(false);
  });

  // Race condition test
  it('adding user1 + sending invite then while sending invite adding user2 both users should get invite', async () => {
    const user1 = createRandomInternalAttendee(AttendeePermission.Read, 'PK', 'user1', { isNew: true });
    const user2 = createRandomInternalAttendee(AttendeePermission.Read, 'PK', 'user2', { isNew: true });
    const event = DecryptedEventModel.fromDecryptedEvent(plainMockEvent({}));

    // getEventsThatShouldSendMailMock mock is called in sendICSEmails when querying events
    // after this query happens the first time we want to add user2 to mock
    // events being added while sending mail
    jest.spyOn(modelUtils, 'getEventsThatShouldSendMail').mockImplementationOnce(async () => {
      const query = await getEventsThatShouldSendMail();
      const updatedEvent = await getEventByID(event.parentEventID);
      assertExists(updatedEvent);
      updatedEvent.decryptedContent.attendees.push(user2);
      updatedEvent.markAsNeedToSendMail(ownerAttendee.calendarID, [EmailContentType.Content]);
      await saveContent(updatedEvent, false, EventSyncState.Done);

      return query;
    });

    // Set event attendees to owner + user1
    event.decryptedContent.attendees = [ownerAttendee, user1];
    event.markAsNeedToSendMail(ownerAttendee.calendarID, [EmailContentType.Content]);
    await saveContent(event, false, EventSyncState.Done);
    await sendICSEmails(); // Wait for first sendICSEmails to complete
    // While sendICSEmail is happening, user2 will be added to the event
    // Check getEventsThatShouldSendMailMock.mockImplementationOnce above
    const updatedEvent = await getEventByID(event.parentEventID);
    assertExists(updatedEvent);
    // We expect the updatedEvent's currentMailTimestamp to be lower than requestMailTimestamp (should send mail)
    expect(shouldEventSendMail(updatedEvent)).toBe(true);
    // We also expect updatedEvent's currentMailTimestamp to be event's requestTimestamp
    expect(updatedEvent.localMetadata.currentMailTimestamp).toBe(event.localMetadata.requestMailTimestamp);
    await sendICSEmails();

    // expect 3 mails to be sent
    // The first is the invite sent to user 1
    // The second is the invite sent to user 2
    // And the this is the update sent to user 1 (that user2 was added)
    expect(sendEmailmock.mock.calls.length).toBe(3);

    const [[mail1], [mail2], [mail3]] = sendEmailmock.mock.calls;

    // Mail1 should be invite to user1
    expect(mail1.to.length).toBe(1);
    expect(mail1.to[0].address).toBe(user1.email);
    expect(mail1.rawSubject).toBe(
      `${
        event.decryptedContent.attendees[0].displayName ?? event.decryptedContent.attendees[0].email
      } invited you to a new event: ${event.decryptedContent.title}`
    );
    // Mail2 should be invite to user2
    expect(mail2.to.length).toBe(1);
    expect(mail2.to[0].address).toBe(user2.email);
    expect(mail2.rawSubject).toBe(
      `${
        event.decryptedContent.attendees[0].displayName ?? event.decryptedContent.attendees[0].email
      } invited you to a new event: ${event.decryptedContent.title}`
    );
    // Mail3 should be update to user1
    expect(mail3.to.length).toBe(1);
    expect(mail3.to[0].address).toBe(user1.email);
    expect(mail3.rawSubject).toBe(
      `${
        event.decryptedContent.attendees[0].displayName ?? event.decryptedContent.attendees[0].email
      } updated the event: ${event.decryptedContent.title}`
    );
  });
});
