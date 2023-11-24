import {
  Button,
  Dialog,
  DISPLAY_SCROLLBAR_CSS,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Type,
  Typography
} from 'nightwatch-ui';
import { FC, useCallback, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { BrowserDesktopView } from 'skiff-front-utils';
import { EventUpdateType } from 'skiff-graphql';
import styled from 'styled-components';

import { useCurrentCalendarID } from '../../apollo/currentCalendarMetadata';
import { EventDraftDiff, useSelectedEventState } from '../../apollo/selectedEvent';
import { UNTITLED_EVENT } from '../../constants/calendar.constants';
import { modalReducer } from '../../redux/reducers/modalReducer';
import {
  isSaveDraftModal,
  SaveDraftModalRecurringAction,
  SaveDraftModalSaveAction
} from '../../redux/reducers/modalTypes';
import { EventAttendeeType } from '../../storage/models/event/types';
import { useAppSelector } from '../../utils/hooks/useAppSelector';
import { isRecurringEvent, isRecurringParent } from '../../utils/recurringUtils';
import { isOnlyRSVPUpdate } from '../../utils/updateTypeUtils';
import { AttendeeState, ParticipantRow, ParticipantRowType } from '../ParticipantSuggestions/ParticipantRow';

import { SaveRecurringEventModal } from './SaveRecurringModal';
import { getSaveModalText, RSVPType } from './utils';

const ButtonContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
`;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const ParticipantList = styled.div`
  flex-direction: column;
  overflow: hidden;
  :hover {
    overflow: auto;
  }
  max-height: 250px;
  width: 100%;
  padding: 8px 0px;
  &:hover {
    ${DISPLAY_SCROLLBAR_CSS}
  }
`;

const ButtonTextContainer = styled.div`
  gap: 18px;
  display: flex;
  align-items: center;
`;

enum SaveDraftModalStage {
  Recurring,
  Participants
}

const getRSVPType = (attendeesDiff: EventDraftDiff['attendeesDiff'] | undefined, calendarID: string | null) => {
  const deletedAttendees = attendeesDiff?.deleted || [];
  const updatedAttendees = attendeesDiff?.updated || [];
  const newAttendees = attendeesDiff?.new || [];
  // If only the current user is updated, it's a RSVP
  if (updatedAttendees.length === 1 && updatedAttendees[0].id === calendarID) return RSVPType.RSVP;
  // If only the current user is deleted, it's a DeleteForMe
  else if (deletedAttendees.length === 1 && deletedAttendees[0].id === calendarID) return RSVPType.DeleteForMe;
  // If no one is deleted or updated, it's a new Event
  else if (deletedAttendees.length === 0 && updatedAttendees.length === 0) {
    const newRSVP = newAttendees.find((attendee) => attendee.id === calendarID);
    // If the current user is in the new attendees, it's a new RSVP
    if (!newRSVP || newRSVP.deleted) return RSVPType.DeleteForMe;
    else return RSVPType.RSVP;
  } else {
    return RSVPType.None;
  }
};

export interface SaveDraftModalProps {
  isOpen: boolean;
}

export const SaveDraftModal: FC<SaveDraftModalProps> = ({ isOpen }) => {
  const [saveDraftModalRecurringAction, setSaveDraftModalRecurringAction] = useState<SaveDraftModalRecurringAction>();
  const [modalStage, setModalStage] = useState<SaveDraftModalStage>();

  const dispatch = useDispatch();

  const openModal = useAppSelector((state) => state.modal.openModal);
  const callback = isSaveDraftModal(openModal) ? openModal.callback : undefined;
  const isDelete = isSaveDraftModal(openModal) ? openModal.isDelete : false;

  const calendarID = useCurrentCalendarID();
  const { selectedDraft, selectedEvent, diffMap, parentRecurringEvent } = useSelectedEventState();

  const isRSVP = isOnlyRSVPUpdate(selectedDraft?.localMetadata.updateType || []);
  const rsvpType = isRSVP ? getRSVPType(diffMap?.attendeesDiff, calendarID) : RSVPType.None;

  // we need to show the recurring content only if the event is already recurring and has been changed
  const savingRecurringEvent =
    (selectedEvent && isRecurringEvent(selectedEvent)) ||
    (selectedDraft && isRecurringEvent(selectedDraft) && !isRecurringParent(selectedDraft));

  // when deleting the event show all the attendees,
  // (also, it's possible to delete an event without creating a draft)
  const draftAttendees = selectedDraft?.decryptedContent.attendees || [];
  const attendeesOnDelete = selectedEvent?.decryptedContent.attendees || draftAttendees;
  const attendees = isDelete ? attendeesOnDelete : draftAttendees;

  // update the stages of the modal (recurring or participant)
  useEffect(() => {
    // if we're saving recurring event and there is still no selected recurring action, set the stage to SaveDraftModalStage.Recurring
    if (savingRecurringEvent && !saveDraftModalRecurringAction) {
      setModalStage(SaveDraftModalStage.Recurring);
    }
  }, [saveDraftModalRecurringAction, savingRecurringEvent, selectedDraft]);

  const resetModalState = () => {
    setModalStage(undefined);
    setSaveDraftModalRecurringAction(undefined);
  };

  const closeModal = useCallback(() => {
    dispatch(modalReducer.actions.setOpenModal(undefined));
    resetModalState();
    callback?.({ saveAction: SaveDraftModalSaveAction.Cancel });
  }, [callback, dispatch]);

  const onSend = useCallback(
    (emailExternalAttendeesOnly: boolean) => {
      dispatch(modalReducer.actions.setOpenModal(undefined));
      resetModalState();
      callback?.({
        saveAction: emailExternalAttendeesOnly
          ? SaveDraftModalSaveAction.SaveWithoutSending
          : SaveDraftModalSaveAction.Save,
        recurringAction: savingRecurringEvent ? saveDraftModalRecurringAction : undefined
      });
    },
    [callback, dispatch, saveDraftModalRecurringAction, savingRecurringEvent]
  );

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') onSend(false);
    },
    [onSend]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const nonDeletedAttendeesWithoutCurrentUser = attendees.filter(
    (attendee) => !attendee.deleted && attendee.id !== calendarID
  );

  // Only show the Don't send button if there is at least one InternalAttendee
  const showDontSendButton = nonDeletedAttendeesWithoutCurrentUser.some(
    (participant) => participant.type === EventAttendeeType.InternalAttendee
  );

  const participantsToRender = [
    ...nonDeletedAttendeesWithoutCurrentUser,
    // when deleting event we are showing all the attendees from the original event
    ...(!isDelete ? diffMap?.attendeesDiff.deleted || [] : [])
  ];

  // we need to show the participant modal only if there are not-deleted participant (without the current user)
  // and we're not mobile
  const shouldShowSentParticipantModal =
    !!(participantsToRender.length && !isMobile) &&
    (!!selectedDraft?.localMetadata.updateType.includes(EventUpdateType.Content) || isDelete);

  const saveRecurringAction = useCallback(
    (action: SaveDraftModalRecurringAction) => {
      // if there are participants to update, and we're not on mobile, we need to show the participant modal
      if (shouldShowSentParticipantModal) {
        setSaveDraftModalRecurringAction(action);
        setModalStage(SaveDraftModalStage.Participants);
      } else {
        resetModalState();
        // if not- we can just resolve with response from the recurring
        callback?.({
          saveAction: SaveDraftModalSaveAction.Save,
          recurringAction: savingRecurringEvent ? action : undefined
        });
      }
    },
    [callback, savingRecurringEvent, shouldShowSentParticipantModal]
  );

  if (!callback || (!diffMap && !isDelete) || !isOpen) return null;

  const { title, description } = getSaveModalText(diffMap, participantsToRender, selectedDraft, isDelete);

  const defaultEventTitle = selectedEvent?.decryptedContent.title || UNTITLED_EVENT;

  // update the users choice from the recurring modal and open the participant modal if needed

  // first show the recurring update type modal, if needed
  if (savingRecurringEvent && modalStage === SaveDraftModalStage.Recurring) {
    return (
      <SaveRecurringEventModal
        draft={selectedDraft}
        event={selectedEvent}
        eventTitle={selectedDraft?.decryptedContent.title ?? defaultEventTitle}
        hasNextStep={shouldShowSentParticipantModal}
        isDelete={isDelete}
        onBack={closeModal}
        onSave={saveRecurringAction}
        parentRecurringEvent={parentRecurringEvent}
        rsvpType={rsvpType}
        saveDraftModalRecurringAction={saveDraftModalRecurringAction}
        setSaveDraftModalRecurringAction={setSaveDraftModalRecurringAction}
      />
    );
  }

  if (!shouldShowSentParticipantModal) return null;

  return (
    <>
      <BrowserDesktopView>
        <Dialog
          customContent
          description={description}
          hideCloseButton
          onClose={closeModal}
          open={isOpen}
          title={title}
        >
          <ParticipantList>
            {participantsToRender.map((participant) => {
              let attendeeState = AttendeeState.Existing;
              if (!!diffMap?.attendeesDiff.new.find((attendee) => attendee.id === participant.id))
                attendeeState = AttendeeState.New;
              else if (!!diffMap?.attendeesDiff.deleted.find((attendee) => attendee.id === participant.id))
                attendeeState = AttendeeState.Removed;
              return (
                <ParticipantRow
                  attendeeState={attendeeState}
                  isReadOnly
                  isSelected
                  key={participant.id}
                  participant={participant}
                  participantRowType={ParticipantRowType.IsInline}
                />
              );
            })}
          </ParticipantList>
          <ButtonContainer>
            <Button onClick={closeModal} type={Type.SECONDARY}>
              Back
            </Button>
            <ButtonTextContainer>
              {showDontSendButton && (
                <Tooltip>
                  <TooltipContent>
                    Updates Skiff guests without sending them an email. Other guests will still be notified by email.
                  </TooltipContent>
                  <TooltipTrigger>
                    <Typography onClick={() => void onSend(true)}>{`Don't send`}</Typography>
                  </TooltipTrigger>
                </Tooltip>
              )}
              <Button onClick={() => void onSend(false)}>Send</Button>
            </ButtonTextContainer>
          </ButtonContainer>
        </Dialog>
      </BrowserDesktopView>
    </>
  );
};

export default SaveDraftModal;
