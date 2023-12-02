import { EventDraftDiff } from '../../apollo/selectedEvent';
import { UNTITLED_EVENT } from '../../constants/calendar.constants';
import { DecryptedDraft } from '../../storage/models/draft/types';
import { EventAttendee } from '../../storage/models/event/types';

export const getSaveModalText = (
  diffMap: EventDraftDiff | undefined,
  participantsToRender: EventAttendee[],
  draft: DecryptedDraft | undefined | null,
  isDelete: boolean
) => {
  const newAttendeesLength = diffMap?.attendeesDiff.new.length;
  const deletedAttendeesLength = diffMap?.attendeesDiff.deleted.length;
  const moreThenOneParticipant = participantsToRender.length > 1;
  const draftTitle = draft?.decryptedContent.title || UNTITLED_EVENT;

  let title = '';
  let description = '';

  if (deletedAttendeesLength && !newAttendeesLength) {
    title = 'Do you want to notify participants they were uninvited?';

    const moreThenOneDeletedParticipant = newAttendeesLength && newAttendeesLength > 1;

    description = `An email will be sent to ${moreThenOneDeletedParticipant ? 'these' : 'this'} participant${
      moreThenOneDeletedParticipant ? 's' : ''
    } of "${draftTitle}".`;
    // Event was deleted
  } else if (isDelete) {
    title = 'Do you want to delete the event?';

    description = `An email will be sent to ${moreThenOneParticipant ? 'these' : 'this'} participant${
      moreThenOneParticipant ? 's' : ''
    } of "${draftTitle}".`;
    // Event has updates / mixed deleted and new participants
  } else {
    title = 'Do you want to send an update to other participants?';

    description = `An email will be sent to ${moreThenOneParticipant ? 'these' : 'this'} participant${
      moreThenOneParticipant ? 's' : ''
    } of "${draftTitle}".`;
  }

  return { title, description };
};

export enum RSVPType {
  RSVP,
  DeleteForMe,
  None
}
