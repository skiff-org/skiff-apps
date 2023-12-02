import { DecryptedEventModel } from '../../storage/models/event/DecryptedEventModel';
import { EventAttendee, EmailTypes } from '../../storage/models/event/types';

export enum SendStatus {
  Fail, // the send has failed, we should mark this event has sent.
  Retry, // when the send fails for something not related to the this specific mails, we want to make sure we try to send it again
  Success // the send has succeeded, we should mark this event has sent.
}

export type SendMailResultType =
  | (
      | {
          event: DecryptedEventModel;
          attendeesToUpdate: EventAttendee[];
          emailTypesSent: EmailTypes[];
          status: SendStatus;
        }
      | undefined
    )[]
  | undefined;
