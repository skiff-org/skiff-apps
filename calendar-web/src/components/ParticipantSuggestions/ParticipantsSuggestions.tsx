import {
  Button,
  DISPLAY_SCROLLBAR_CSS,
  Icon,
  InputField,
  Size,
  Type,
  useOnClickOutside,
  useOnEscapePress
} from 'nightwatch-ui';
import React, { Dispatch, SetStateAction, useCallback, useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useCurrentUserEmailAliases, useRequiredCurrentUserData, useToast } from 'skiff-front-utils';
import { insertIf } from 'skiff-utils';
import styled from 'styled-components';
import isEmail from 'validator/lib/isEmail';

import { AttendeePermission, AttendeeStatus } from '../../../generated/graphql';
import { useSelectedEventState } from '../../apollo/selectedEvent';
import { AUTOCOMPLETE_PAPER_CLASS, ESCAPE_SELECTOR, SEND_INVITE_BTN } from '../../constants/calendar.constants';
import { DrawerTypes } from '../../redux/reducers/mobileDrawerReducer';
import { getDraftByID } from '../../storage/models/draft/modelUtils';
import {
  EventAttendee,
  EventAttendeeType,
  ExternalAttendee,
  InternalAttendeeWithPublicKey,
  isUnresolvedAttendee,
  UpdateEventArgs
} from '../../storage/models/event/types';
import { mergeAttendees } from '../../storage/models/EventAttendee';
import {
  filterUserFromAttendees,
  finishEditDraft,
  finishEditDraftWithSaveDraftModal,
  getInviteOrUpdateText,
  getParticipantTitle,
  isDiffContentChanges,
  isExistingParticipant,
  performOnNextTik,
  resolveAttendees,
  UpdateRSVPResultType,
  updateSelectedEventRSVP
} from '../../utils';
import { useAttendeesAutoComplete } from '../../utils/hooks/useAttendeesAutoComplete';
import { useMobileDrawer } from '../../utils/hooks/useMobileDrawer';
import { isRecurringEvent } from '../../utils/recurringUtils';
import { isOnlyRSVPUpdate } from '../../utils/updateTypeUtils';

import { EventRSVP } from './EventRSVP';
import {
  ExternalMailCooldownType,
  generateUpdateOrInviteToastProps,
  getExternalMailCooldownType
} from './isAbleToSendExternalMail';
import MobileParticipantActionsDrawer from './MobileParticipantActionsDrawer';
import MobileParticipantAutocomplete from './MobileParticipantAutocomplete';
import ParticipantAutocomplete from './ParticipantAutocomplete';
import { ParticipantRow, ParticipantRowType } from './ParticipantRow';
import { ParticipantActions } from './ParticipantsSuggestions.types';

const AutocompleteContainer = styled.div`
  position: relative;
`;

const ParticipantSuggestionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const ParticipantList = styled.ul`
  list-style-type: none;
  margin: 0;
  padding: 0;
  width: 100%;
  max-height: ${isMobile ? 120 : 200}px;
  overflow-y: auto;
  box-sizing: border-box;
  overflow-x: hidden;
  text-overflow: ellipsis;
  &:hover {
    ${DISPLAY_SCROLLBAR_CSS}
  }
`;

const InputFieldAndList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

interface ParticipantsSuggestionsProps {
  currentUserParticipant: EventAttendee;
  setIsUpdatingEvent?: Dispatch<SetStateAction<boolean>>;
  selectedEventID: string | undefined;
  calendarID: string;
  attendees: EventAttendee[];
  canEdit: boolean;
  setAttendees: React.Dispatch<React.SetStateAction<EventAttendee[]>>;
  updateDraftDetails: (newDetails: UpdateEventArgs) => Promise<void>;
}

export const ParticipantsSuggestions = ({
  selectedEventID,
  canEdit,
  currentUserParticipant,
  calendarID,
  attendees,
  setAttendees,
  updateDraftDetails,
  setIsUpdatingEvent
}: ParticipantsSuggestionsProps) => {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState(false);
  // Participant id to show actions for in participant actions drawer (mobile)
  const [activeParticipantID, setActiveParticipantID] = useState<undefined | string>(undefined);
  const [showAutocompletePaper, setShowAutocompletePaper] = useState(false);

  const { enqueueToast } = useToast();
  const { emailAliases: aliases } = useCurrentUserEmailAliases();
  const { username } = useRequiredCurrentUserData();

  const { autocompleteProps, highlightedOption, currentUserAliases } = useAttendeesAutoComplete({
    setInputValue,
    setInputError,
    showAutocompletePaper,
    setShowAutocompletePaper
  });
  const { openDrawer: showParticipantActionsDrawer, closeDrawer: hideParticipantActionsDrawer } = useMobileDrawer(
    DrawerTypes.ParticipantActions
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const autocompletePaperRef = useRef<HTMLDivElement>(null);
  const participantRowRef = useRef<HTMLDivElement>(null);

  const { diffMap, selectedDraft } = useSelectedEventState();

  const filterOurCurrentUser = useCallback(
    (attendee: EventAttendee): boolean => filterUserFromAttendees(attendee, calendarID),
    [calendarID]
  );

  const notDeletedAttendees = attendees.filter((attendee) => !attendee.deleted);
  const participantsWithoutCurrentUser = useMemo(
    () => notDeletedAttendees.filter(filterOurCurrentUser),
    [notDeletedAttendees, filterOurCurrentUser]
  );

  const currentUserAttendee = attendees.find((attendee) => attendee.id === calendarID);
  const invalidAlias = !(aliases || []).includes(currentUserAttendee?.email || '');

  const updateRSVP = useCallback(
    async (rsvpValue: AttendeeStatus) => {
      const result = await updateSelectedEventRSVP(calendarID, { attendeeStatus: rsvpValue });
      if (result.type !== UpdateRSVPResultType.Success) {
        if (result.type === UpdateRSVPResultType.Error) {
          enqueueToast({
            title: 'Could not update RSVP',
            body: result.error || 'Try updating the event again'
          });
        }
        return;
      }
      // Update the curr user attendee rsvp value in component state
      setAttendees((prevAttendees) =>
        prevAttendees.map((attendee) => {
          // Current user on the attendee list with the new RSVP value
          if (attendee.id === calendarID) return { ...attendee, attendeeStatus: rsvpValue };
          return attendee;
        })
      );
    },
    [calendarID, enqueueToast, setAttendees]
  );

  // set the passed attendee as optional/required and saved the modified draft
  const setParticipantOptional = async (isOptional: boolean, participantToSet: EventAttendee) => {
    // update attendees state with the optional participant
    const updatedAttendees = notDeletedAttendees.map((attendee) => {
      if (attendee.id === participantToSet.id) {
        attendee.optional = isOptional;
      }
      return attendee;
    });

    // update the component local state
    setAttendees(updatedAttendees);
    // update the draft
    await updateDraftDetails({ decryptedContent: { attendees: updatedAttendees } });
  };

  // add a new participant to the event and save the modified draft
  const addParticipant = async (participantOrString: EventAttendee | string) => {
    if (!selectedEventID) {
      throw new Error('Cannot add guest without a valid selectedEventID');
    }

    // assign the participant object
    let newParticipant: EventAttendee | InternalAttendeeWithPublicKey | ExternalAttendee =
      typeof participantOrString === 'string'
        ? {
            id: participantOrString,
            email: participantOrString,
            permission: AttendeePermission.Read,
            optional: false,
            type: EventAttendeeType.UnresolvedAttendee,
            attendeeStatus: AttendeeStatus.Pending,
            deleted: false,
            updatedAt: Date.now(),
            isNew: true
          }
        : { ...participantOrString, isNew: true };

    // We need to resolve the participant before checking if they are already in the list
    // because if that is a skiff user, we fist need to set the id to the calendarID

    // Resolve participant before adding them to the participants list
    if (isUnresolvedAttendee(newParticipant)) {
      newParticipant = (await resolveAttendees([newParticipant]))[0];
    }

    // Do not add the participant if they already exist in the list
    if (isExistingParticipant(notDeletedAttendees, newParticipant)) {
      setInputValue('');
      return;
    }

    // Check if trying to add self as a participant
    if (newParticipant.id === calendarID) {
      throw new Error('Cannot add self as a participant.');
    }

    // update attendees state with the new participant
    const { mergedAttendees } = mergeAttendees(attendees, [newParticipant]);

    // update local state
    setAttendees(mergedAttendees);
    // scroll to the last added participant
    participantRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    // update the draft
    await updateDraftDetails({ decryptedContent: { attendees: mergedAttendees } });
  };

  // remove participant from the event and save the modified draft
  const deleteParticipant = async (participant: EventAttendee) => {
    const updatedAttendees = attendees.map((attendee) => {
      if (attendee.id === participant.id) {
        return {
          ...attendee,
          deleted: true,
          isNew: true // mark as new to send un-invite emails
        };
      }

      return attendee;
    });

    // update local state
    setAttendees(updatedAttendees);
    // update the draft
    await updateDraftDetails({ decryptedContent: { attendees: updatedAttendees } });
  };

  const newParticipantsAdded = (diffMap?.attendeesDiff.new?.length || 0) > 0;
  const onlyRsvpUpdates = isOnlyRSVPUpdate(selectedDraft?.localMetadata.updateType ?? []);

  const contentUpdates = diffMap && isDiffContentChanges(diffMap) && !onlyRsvpUpdates;

  const { groupedOptions } = autocompleteProps;
  // excluding conflicting props.
  const {
    value,
    size,
    type,
    onClick,
    ref: autoCompleteRef,
    ...inputProps
  } = autocompleteProps.getInputProps() as React.InputHTMLAttributes<HTMLInputElement> & {
    ref: React.MutableRefObject<HTMLInputElement>;
  };

  const saveWithUpdatingParticipants = async () => {
    if (!selectedEventID || !calendarID) {
      console.error(`sendInviteOrUpdate: Could not send invite or update!`);
      enqueueToast({
        title: 'Could not send invite or update',
        body: 'Try again or contact support.'
      });
      return;
    }

    const draft = await getDraftByID(selectedEventID);

    // Incase this is a recurring event we want to open the modal to select the recurring update type
    if (draft && isRecurringEvent(draft)) await finishEditDraftWithSaveDraftModal(selectedEventID, calendarID);
    // Incase this is not a recurring event we can just save the draft
    else await finishEditDraft(selectedEventID, calendarID);

    const cooldownType = await getExternalMailCooldownType(selectedEventID, calendarID);
    const hasCooldown = cooldownType !== ExternalMailCooldownType.NoCooldown && cooldownType !== undefined;
    if (hasCooldown) {
      const toastProps = generateUpdateOrInviteToastProps(cooldownType, getInviteOrUpdateText(newParticipantsAdded));
      enqueueToast(toastProps);
    }
  };

  // Create participant row actions for each participant that should be rendered
  // structured as {[key: participantID]: ParticipantRowActions}
  // this is done in order to share actions between drawer on mobile and dropdown on browser
  const participantRowActions: ParticipantActions = {};
  notDeletedAttendees.forEach((participant) => {
    participantRowActions[participant.id] = [
      {
        label: !participant.optional ? 'Mark optional' : 'Mark required',
        onClick: async () => {
          await setParticipantOptional(!participant.optional, participant);
          if (isMobile) {
            hideParticipantActionsDrawer();
          }
        },
        key: 'Mark'
      },
      ...insertIf(participant.permission !== AttendeePermission.Owner, {
        label: 'Delete',
        key: 'delete',
        alert: true,
        onClick: async () => {
          await deleteParticipant(participant);
          if (isMobile) {
            hideParticipantActionsDrawer();
          }
        }
      })
    ];
  });

  // When clicking on participant container
  // Called on mobile only to open participant actions drawer
  const onParticipantClick = (participantID: string) => {
    if (!canEdit) return;
    setActiveParticipantID(participantID);
    if (isMobile) showParticipantActionsDrawer();
  };

  const emailAddressIsCurrentUser = (emailAddress: string) =>
    emailAddress === username || currentUserAliases.includes(emailAddress);

  const addHighlightedParticipant = (participant?: EventAttendee | string) => {
    if (groupedOptions.length === 0) {
      highlightedOption.current = undefined;
      setShowAutocompletePaper(false);
    }
    const newParticipant = participant ?? highlightedOption.current ?? inputValue;
    if (!newParticipant) return;

    // Validate a string participant
    if (typeof newParticipant === 'string') {
      if (!isEmail(newParticipant)) {
        enqueueToast({ title: 'Invalid guest', body: 'Must enter a valid email.' });
        setInputError(true);
        return;
      }
      if (emailAddressIsCurrentUser(newParticipant)) {
        enqueueToast({
          title: 'Invalid guest',
          body: 'Cannot add yourself to an event.'
        });
        setInputError(true);
        return;
      }
    }

    void addParticipant(newParticipant).catch((e) => {
      enqueueToast({ title: 'Could not add guest', body: 'Try adding the guest again.' });
      setInputError(true);
      console.error(e);
      return;
    });

    // Blur input field
    if (!inputRef.current) return;
    inputRef.current.blur();
    highlightedOption.current = undefined;
    performOnNextTik(() => {
      setInputValue('');
      setShowAutocompletePaper(false);
    });
  };

  const shouldRenderParticipants = !!participantsWithoutCurrentUser.length;

  const closeAutocompletePaper = () => {
    // If input element not focused do nothing
    if (document.activeElement !== inputRef.current) return;
    highlightedOption.current = undefined;
    setShowAutocompletePaper(false);
    setIsUpdatingEvent?.(true);
    addHighlightedParticipant();
    performOnNextTik(() => {
      setIsUpdatingEvent?.(false);
    });
  };

  // Clicking outside should submit the inputted participant
  // Ignore clicks within the autocomplete dropdown
  useOnClickOutside(
    inputRef,
    closeAutocompletePaper,
    [AUTOCOMPLETE_PAPER_CLASS, SEND_INVITE_BTN],
    {},
    [],
    !value || isMobile // ignore outside clicks for mobile so that the save/update btn triggers
  );

  useOnEscapePress(autocompletePaperRef, ESCAPE_SELECTOR, closeAutocompletePaper);

  if (!canEdit) {
    const tempInput = document.createElement('input');
    autoCompleteRef.current = tempInput;
  }

  return (
    <>
      <ParticipantSuggestionsContainer>
        <InputFieldAndList>
          {canEdit && (
            <AutocompleteContainer {...autocompleteProps.getRootProps()}>
              {/* Input field must be in a form to submit in android */}
              <form>
                <InputField
                  error={!!inputError}
                  icon={Icon.UserPlus}
                  innerRef={inputRef}
                  onKeyDown={(keyDownEvent) => {
                    if (keyDownEvent.key !== 'Enter') return;
                    keyDownEvent.preventDefault();
                    // We blur the input field on Enter to clear the input field
                    // and then we focus again in case the user wants to add more participants
                    if (isEmail(inputValue)) highlightedOption.current = undefined;
                    addHighlightedParticipant();
                    inputRef.current?.focus();
                    // the autocomplete overrides the input value with the inserted email - so we wait for it to finish and then set it to empty string
                    performOnNextTik(() => {
                      setInputValue('');
                      setShowAutocompletePaper(false);
                    });
                  }}
                  placeholder='Add participant'
                  ref={(val) => {
                    const input = val?.querySelector('input');
                    if (!input) return;
                    autoCompleteRef.current = input;
                  }}
                  size={isMobile ? Size.MEDIUM : Size.SMALL}
                  value={inputValue}
                  {...inputProps}
                />
              </form>
              {!isMobile && groupedOptions.length > 0 && (
                <ParticipantAutocomplete
                  autocompeteRef={autocompletePaperRef}
                  calendarID={calendarID}
                  getListboxProps={autocompleteProps.getListboxProps}
                  getOptionProps={autocompleteProps.getOptionProps}
                  groupedOptions={groupedOptions as EventAttendee[]}
                  submitParticipant={addHighlightedParticipant}
                />
              )}
              {isMobile && groupedOptions.length > 0 && value?.valueOf() && (
                <MobileParticipantAutocomplete
                  calendarID={calendarID}
                  getListboxProps={autocompleteProps.getListboxProps}
                  getOptionProps={autocompleteProps.getOptionProps}
                  groupedOptions={groupedOptions as EventAttendee[]}
                  submitParticipant={addHighlightedParticipant}
                />
              )}
            </AutocompleteContainer>
          )}
          {shouldRenderParticipants && (
            <>
              <ParticipantList onTouchMove={(e) => e.stopPropagation()}>
                {notDeletedAttendees.map((participant) => (
                  <ParticipantRow
                    actions={participantRowActions[participant.id]}
                    containerRef={participantRowRef}
                    isCurrentUser={
                      participant.type === EventAttendeeType.InternalAttendee && participant.calendarID === calendarID
                    }
                    isReadOnly={!canEdit}
                    isSelected
                    key={participant.email}
                    onParticipantClick={isMobile ? onParticipantClick : undefined}
                    participant={participant}
                    participantRowType={ParticipantRowType.ShowEmailTooltip}
                  />
                ))}
              </ParticipantList>
              {!newParticipantsAdded && !contentUpdates && !invalidAlias && (
                <EventRSVP
                  initialResponse={currentUserParticipant.attendeeStatus}
                  update={(newStatus: AttendeeStatus) => void updateRSVP(newStatus)}
                />
              )}
            </>
          )}
        </InputFieldAndList>
        {shouldRenderParticipants && contentUpdates && !isMobile && (
          <div className={SEND_INVITE_BTN}>
            <Button fullWidth onClick={saveWithUpdatingParticipants} size={Size.SMALL} type={Type.SECONDARY}>
              {`Send ${getInviteOrUpdateText(newParticipantsAdded)}`}
            </Button>
          </div>
        )}
      </ParticipantSuggestionsContainer>
      {isMobile && (
        <MobileParticipantActionsDrawer
          actions={activeParticipantID ? participantRowActions[activeParticipantID] : undefined}
          drawerTitle={getParticipantTitle(activeParticipantID, notDeletedAttendees)}
        />
      )}
    </>
  );
};
