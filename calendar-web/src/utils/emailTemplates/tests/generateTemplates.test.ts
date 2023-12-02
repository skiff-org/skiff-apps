import { AttendeePermission } from 'skiff-graphql';

import { createRandomInternalAttendee } from '../../../../tests/fixture/event';
import { plainMockEvent } from '../../../../tests/mocks/encryptedEvent';
import { EmailTypes } from '../../../storage/models/event/types';
import { EmailTemplateGenerator } from '../generateTemplates';

const event = plainMockEvent({
  plainContent: { startDate: 1668481919, endDate: 1668481977 }
});
// Set a custom date to ensure matching with existing generated template
const owner = createRandomInternalAttendee(AttendeePermission.Owner, 'testEvent1publicKey1', 'testEvent1Attendee1');
event.decryptedContent.attendees = [
  owner,
  createRandomInternalAttendee(AttendeePermission.Read, 'testEvent1publicKey2', 'testEvent1Attendee2')
];

describe('Timezones', () => {
  it('should always be UTC', () => {
    expect(new Date().getTimezoneOffset()).toBe(0);
  });
});

describe('test base EmailTemplateGenerator', () => {
  it('invitation template matches generated', async () => {
    const emailTemplate = new EmailTemplateGenerator(EmailTypes.Invite, event, { address: owner.email });
    const generatedTemplateContent = await emailTemplate.generate();
    expect(generatedTemplateContent).toMatchSnapshot('invitationEmail');
  });
  it('update template matches generated', async () => {
    const emailTemplate = new EmailTemplateGenerator(EmailTypes.Update, event, { address: owner.email });
    const generatedTemplateContent = await emailTemplate.generate();
    expect(generatedTemplateContent).toMatchSnapshot('updateEmail');
  });
  it('delete template matches generated', async () => {
    const emailTemplate = new EmailTemplateGenerator(EmailTypes.GlobalDelete, event, { address: owner.email });
    const generatedTemplateContent = await emailTemplate.generate();
    expect(generatedTemplateContent).toMatchSnapshot('deletionEmail');
  });
  it('empty title event email template generation', async () => {
    // Get the existing title string
    const defaultTitle = event.decryptedContent.title;

    // Set the title to empty string
    event.decryptedContent.title = '';

    // Generate template
    const emailTemplate = new EmailTemplateGenerator(EmailTypes.Invite, event, { address: owner.email });
    const generatedTemplateContent = await emailTemplate.generate();

    // Expect the title to be set to string "Untitled Event"
    expect(generatedTemplateContent.includes('Untitled Event')).toBeTruthy();

    // Reset the title to original string
    event.decryptedContent.title = defaultTitle;
  });
});
