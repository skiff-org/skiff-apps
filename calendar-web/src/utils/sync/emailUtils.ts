import partition from 'lodash/partition';
import { decryptSessionKey, decryptDatagramV2 } from 'skiff-crypto';
import {
  models,
  AttachmentDatagram,
  AttachmentMetadataDatagram,
  GetAttachmentsDocument,
  GetAttachmentsQuery,
  GetAttachmentsQueryVariables
} from 'skiff-front-graphql';
import { getAllAliasesForCurrentUser } from 'skiff-front-utils';
import { AttachmentMetadataBody } from 'skiff-mail-protos';
import { filterExists } from 'skiff-utils';

import {
  AttendeeStatus,
  Email,
  GetEmailsWithUnreadIcsQuery,
  SendAddressRequest,
  SendEmailRequest,
  SendMessageDocument,
  SendMessageMutation,
  SendMessageMutationVariables
} from '../../../generated/graphql';
import client from '../../apollo/client';
import store from '../../redux/store/reduxStore';
import {
  DecryptedEvent,
  EmailContentType,
  EmailTypes,
  EventAttendee,
  EventAttendeeType
} from '../../storage/models/event/types';
import { getEventOwner } from '../../storage/models/event/utils';
import { getAttendeeStatusByAddress, withoutDeleted } from '../attendeeUtils';

import { createEventEmail, SendICSEmailRequest } from './icsUtils';

export const sendEmailWithUpload = (request: SendEmailRequest) => {
  return client.mutate<SendMessageMutation, SendMessageMutationVariables>({
    mutation: SendMessageDocument,
    variables: {
      request
    },
    context: {
      headers: {
        'Apollo-Require-Preflight': true // this is required for attachment uploading. Otherwise, router backend will reject request.
      }
    },
    errorPolicy: 'all'
  });
};

type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
  ? ElementType
  : never;

export interface EncryptedEmail {
  id: string;
  from: string;
  attachmentMetadata: Email['attachmentMetadata'];
  encryptedSessionKey: Email['encryptedSessionKey'];
  decryptedSessionKey: string;
  decryptedAttachments: {
    attachmentID: string;
    decryptedMetadata: AttachmentMetadataBody;
  }[];
}

export const decryptEmail = (
  encryptedEmail: ArrayElement<GetEmailsWithUnreadIcsQuery['emailsWithUnreadICS2']['emails']>,
  privateKey: string
): EncryptedEmail => {
  const { attachmentMetadata, encryptedSessionKey, id } = encryptedEmail;

  const decryptedSessionKey = decryptSessionKey(
    encryptedSessionKey.encryptedSessionKey,
    privateKey,
    encryptedSessionKey.encryptedBy
  );

  const decryptedAttachments = attachmentMetadata.map((attachment) => ({
    attachmentID: attachment.attachmentID,
    decryptedMetadata: decryptDatagramV2(
      AttachmentMetadataDatagram,
      decryptedSessionKey,
      attachment.encryptedData.encryptedData
    ).body
  }));

  return {
    from: encryptedEmail.from.address,
    decryptedAttachments,
    attachmentMetadata,
    id,
    encryptedSessionKey,
    decryptedSessionKey
  };
};

export type AttachmentContentTuple = [attachmentID: string, icsContent: string];

export const fetchAndDecryptAttachments = async (
  attachmentsToFetch: string[],
  privateKey: string
): Promise<AttachmentContentTuple[]> => {
  const { data: getAttachmentsData } = await client.query<GetAttachmentsQuery, GetAttachmentsQueryVariables>({
    query: GetAttachmentsDocument,
    variables: { ids: attachmentsToFetch }
  });
  if (!getAttachmentsData.attachments || getAttachmentsData.attachments.length === 0) return [];

  const { default: axios } = await import('axios');
  const decryptedAttachmentsArray = await Promise.all(
    getAttachmentsData.attachments.filter(filterExists).map(async (attachment): Promise<AttachmentContentTuple> => {
      const fetchResponse = await axios.get<string>(attachment.downloadLink);
      const encryptedAttachmentContent = fetchResponse.data;

      const decryptedSessionKey = decryptSessionKey(
        attachment.encryptedSessionKey.encryptedSessionKey,
        privateKey,
        attachment.encryptedSessionKey.encryptedBy
      );

      const decryptedAttachmentContent = decryptDatagramV2(
        AttachmentDatagram,
        decryptedSessionKey,
        encryptedAttachmentContent
      ).body.content;

      return [attachment.attachmentID, window.atob(decryptedAttachmentContent)];
    })
  );

  return decryptedAttachmentsArray;
};

export const createICSEmailRequests = async (
  isGlobalDelete: boolean,
  event: DecryptedEvent,
  toAttendees: EventAttendee[],
  userData: models.User,
  decryptionServicePublicKey: { key: string },
  fromAddress: SendAddressRequest
) => {
  const requests: SendICSEmailRequest[] = [];

  // Create an email request and add it to requests array
  const addEmailRequest = async (emailType: EmailTypes, to: EventAttendee[]) => {
    if (!to.length) return;
    const request = await createEventEmail(emailType, event, to, userData, decryptionServicePublicKey, fromAddress);
    if (request) requests.push(request);
  };

  // If the event has been globally deleted (a user who has write permission, deleted the event)
  // We will create a delete email request as long as a delete email has NOT already been sent
  if (isGlobalDelete && !event.localMetadata.eventEmails.sent.includes(EmailTypes.GlobalDelete)) {
    await addEmailRequest(EmailTypes.GlobalDelete, toAttendees);
    return requests;
  }

  const { queue: eventEmailQueue } = event.localMetadata.eventEmails;
  if (
    eventEmailQueue.includes(EmailContentType.Content) ||
    eventEmailQueue.includes(EmailContentType.ContentExternal)
  ) {
    const filteredToAttendees = eventEmailQueue.includes(EmailContentType.ContentExternal)
      ? toAttendees.filter((attendee) => attendee.type === EventAttendeeType.ExternalAttendee)
      : toAttendees;
    // If the event has not been globally deleted we will create invite and/or update email requests
    const [attendeesToInviteOrUninvite, attendeesToUpdate] = partition(filteredToAttendees, (att) => att.isNew);

    // create an invite or uninvite email request for new attendees as long an email has NOT already been sent
    if (attendeesToInviteOrUninvite.length) {
      const [deletedAttendees, newAttendees] = partition(attendeesToInviteOrUninvite, (att) => att.deleted);
      if (!event.localMetadata.eventEmails.sent.includes(EmailTypes.Invite) && newAttendees.length > 0) {
        await addEmailRequest(EmailTypes.Invite, newAttendees);
      }
      if (!event.localMetadata.eventEmails.sent.includes(EmailTypes.Uninvite) && deletedAttendees.length > 0) {
        await addEmailRequest(EmailTypes.Uninvite, deletedAttendees);
      }
    }

    // Create an update email request for non-new users as long an update email has NOT already been sent
    if (attendeesToUpdate.length && !event.localMetadata.eventEmails.sent.includes(EmailTypes.Update)) {
      await addEmailRequest(EmailTypes.Update, attendeesToUpdate.filter(withoutDeleted));
    }
  }

  // Create an RSVP email request as long as it has NOT been sent already
  if (
    event.localMetadata.eventEmails.queue.includes(EmailContentType.Rsvp) &&
    !event.localMetadata.eventEmails.sent.includes(EmailTypes.RSVP)
  ) {
    const owner = getEventOwner(event);
    // Don't send the email to yourself
    if (owner?.email !== fromAddress.address) {
      const attendeeStatus = getAttendeeStatusByAddress(event, fromAddress.address);
      const emailAliases = await getAllAliasesForCurrentUser(client);

      // check if the `from` address is still a valid alias, if not send `deleted alias` email
      if (attendeeStatus === AttendeeStatus.No && !emailAliases.includes(fromAddress.address)) {
        await addEmailRequest(EmailTypes.AliasDeleted, [owner]);
      } else if (owner && attendeeStatus !== AttendeeStatus.Pending) {
        await addEmailRequest(EmailTypes.RSVP, [owner]);
      }
    }
  }
  return requests;
};

export const validateAndAttachCaptchaToken = async (
  requests: SendICSEmailRequest[]
): Promise<SendICSEmailRequest[]> => {
  // If we have requests, call requestHcaptcha and add captchaToken to each requests.
  // We don't do this for empty requests because we sync very often relatively to
  // sending emails, so we want to only call requestHcaptcha when we're sending.
  const requestHcaptchaToken = store.getState().calendar.requestHCaptchaTokenRef;

  const sendEmailRequestsWithCaptcha: SendICSEmailRequest[] = [];
  for (const request of requests) {
    let captchaToken = '';
    if (requestHcaptchaToken) {
      try {
        captchaToken = await requestHcaptchaToken();
      } catch (error) {
        console.error('Captcha error', error);
      }
    }
    sendEmailRequestsWithCaptcha.push({
      ...request,
      emailRequest: {
        ...request.emailRequest,
        captchaToken
      }
    });
  }
  return sendEmailRequestsWithCaptcha;
};
