import { Button, ButtonGroup, ButtonGroupItem, Dialog, Type, Typography, Layout } from 'nightwatch-ui';
import React, { FC, useEffect } from 'react';
import { isMobile, MobileView } from 'react-device-detect';
import { BrowserDesktopView, Drawer, useTheme } from 'skiff-front-utils';
import styled from 'styled-components';

import { useCurrentCalendarID } from '../../apollo/currentCalendarMetadata';
import { SaveDraftModalRecurringAction } from '../../redux/reducers/modalTypes';
import { DecryptedDraft } from '../../storage/models/draft/types';
import { DecryptedEvent } from '../../storage/models/event/types';
import { canUserEditEvent } from '../../utils';

import { SaveRecurringModalContent } from './SaveRecurringModalContent';
import { RSVPType } from './utils';

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const FitContentButton = styled.div`
  width: fit-content;
`;

export interface SaveDraftModalProps {
  setSaveDraftModalRecurringAction: (action: SaveDraftModalRecurringAction) => void;
  onSave: (action: SaveDraftModalRecurringAction) => void;
  onBack: () => void;
  event: DecryptedEvent | null;
  draft: DecryptedDraft | null;
  isDelete: boolean;
  eventTitle: string;
  hasNextStep: boolean;
  parentRecurringEvent?: DecryptedEvent | null;
  saveDraftModalRecurringAction?: SaveDraftModalRecurringAction;
  rsvpType: RSVPType;
}

const getMainButtonText = (isDelete: boolean, nextStep: boolean, rsvpType: RSVPType) => {
  if (isDelete) return 'Delete';
  if (nextStep) return 'Confirm';
  if (rsvpType !== RSVPType.None) return rsvpType === RSVPType.RSVP ? 'RSVP' : 'Delete';
  return 'Update';
};

const getTitleStartText = (isDelete: boolean, rsvpType: RSVPType) => {
  if (isDelete) return 'Delete';
  if (rsvpType !== RSVPType.None) return rsvpType === RSVPType.RSVP ? 'RSVP to' : 'Delete';
  return 'Update';
};

export const SaveRecurringEventModal: FC<SaveDraftModalProps> = ({
  saveDraftModalRecurringAction,
  setSaveDraftModalRecurringAction,
  onSave,
  onBack,
  event,
  draft,
  isDelete,
  eventTitle,
  hasNextStep,
  parentRecurringEvent,
  rsvpType
}) => {
  const { theme } = useTheme();
  const calendarID = useCurrentCalendarID();
  const recurrenceRule = draft?.plainContent.recurrenceRule;

  const recurrenceRuleDeleted = !recurrenceRule;
  const recurrenceRuleNotEqual =
    draft?.plainContent.recurrenceRule &&
    parentRecurringEvent?.plainContent.recurrenceRule &&
    draft.plainContent.recurrenceRule.toJsonString() !==
      parentRecurringEvent?.plainContent.recurrenceRule?.toJsonString();

  const changeInRecurrenceRule = recurrenceRuleDeleted || recurrenceRuleNotEqual;
  const recurrenceDate = draft?.plainContent.recurrenceDate || event?.plainContent.recurrenceDate;

  const existingInstance = draft || event;

  // we're not using the util here because it's possible the recurrence rule will be undefined and the event will be considered as not recurring
  const isParentEvent = !existingInstance?.plainContent.parentRecurrenceID;

  const isLastRecurrence = recurrenceRule && recurrenceRule.getLastDate()?.getTime() === recurrenceDate;

  // whether the draft is has different frequency than the event (and the event is already saved)
  // when the event is not saved we treat it as the frequency hasn't changed
  const draftChangingFrequency =
    draft && event && draft.plainContent.recurrenceRule?.frequency !== event.plainContent.recurrenceRule?.frequency;

  // this will be true only for attendees that not shared with the series parent event
  const childEventWithoutParent = !parentRecurringEvent && !isParentEvent;

  // update default checked recurrence update type
  useEffect(() => {
    if (saveDraftModalRecurringAction) return;

    // Attendee that not invited to the parent event
    if (childEventWithoutParent) {
      onSave(SaveDraftModalRecurringAction.ThisEvent);
    } else if (!changeInRecurrenceRule || isDelete) {
      setSaveDraftModalRecurringAction(SaveDraftModalRecurringAction.ThisEvent);
    } else if (!isParentEvent && !isLastRecurrence && !recurrenceRuleDeleted && !draftChangingFrequency) {
      setSaveDraftModalRecurringAction(SaveDraftModalRecurringAction.ThisAndFutureEvents);
    } else {
      // in case there is only one option we can immediately save with SaveDraftModalRecurringAction.AllEvents
      onSave(SaveDraftModalRecurringAction.AllEvents);
    }
  }, [
    changeInRecurrenceRule,
    draftChangingFrequency,
    recurrenceRuleDeleted,
    isDelete,
    isLastRecurrence,
    isParentEvent,
    onSave,
    saveDraftModalRecurringAction,
    setSaveDraftModalRecurringAction,
    childEventWithoutParent
  ]);

  if ((!draft && !event) || !saveDraftModalRecurringAction) return null;

  const attendees = isDelete ? event?.decryptedContent.attendees || [] : draft?.decryptedContent.attendees || [];

  const currentUserAttendee = attendees.find((attendee) => attendee.id === calendarID);
  const isReadOnly = currentUserAttendee && !canUserEditEvent(currentUserAttendee);

  const Buttons = () =>
    isMobile ? (
      <ButtonGroup fullWidth layout={Layout.STACKED}>
        <ButtonGroupItem
          label={getMainButtonText(isDelete, hasNextStep, rsvpType)}
          onClick={() => onSave(saveDraftModalRecurringAction)}
          type={isDelete ? Type.DESTRUCTIVE : undefined}
        />
        <ButtonGroupItem label='Back' onClick={onBack} />
      </ButtonGroup>
    ) : (
      <ButtonsContainer>
        <Button onClick={onBack} type={Type.SECONDARY}>
          Back
        </Button>
        <FitContentButton>
          <Button onClick={() => void onSave(saveDraftModalRecurringAction)}>
            {getMainButtonText(isDelete, hasNextStep, rsvpType)}
          </Button>
        </FitContentButton>
      </ButtonsContainer>
    );

  const title = `${getTitleStartText(isDelete, rsvpType)} recurring event "${eventTitle}"`;

  const disclaimer = saveDraftModalRecurringAction !== SaveDraftModalRecurringAction.ThisEvent &&
    changeInRecurrenceRule &&
    !isDelete && (
      <Typography color='yellow' wrap>
        Previous modifications on this series will be lost.
      </Typography>
    );

  return (
    <>
      <BrowserDesktopView>
        <Dialog customContent hideCloseButton onClose={onBack} open title={title}>
          <SaveRecurringModalContent
            changeInRecurrenceRule={!!changeInRecurrenceRule}
            draft={draft}
            event={event}
            isDelete={isDelete}
            isLastRecurrence={!!isLastRecurrence}
            isParentEvent={!!isParentEvent}
            isReadOnly={!!isReadOnly}
            onSave={onSave}
            saveDraftModalRecurringAction={saveDraftModalRecurringAction}
            setSaveDraftModalRecurringAction={setSaveDraftModalRecurringAction}
          />
          {disclaimer}
          <Buttons />
        </Dialog>
      </BrowserDesktopView>
      <MobileView>
        <Drawer forceTheme={theme} hideDrawer={onBack} show={true} title={title}>
          <SaveRecurringModalContent
            changeInRecurrenceRule={!!changeInRecurrenceRule}
            draft={draft}
            event={event}
            isDelete={isDelete}
            isLastRecurrence={!!isLastRecurrence}
            isParentEvent={!!isParentEvent}
            isReadOnly={!!isReadOnly}
            onSave={onSave}
            saveDraftModalRecurringAction={saveDraftModalRecurringAction}
            setSaveDraftModalRecurringAction={setSaveDraftModalRecurringAction}
          />
          {disclaimer}
          <Buttons />
        </Drawer>
      </MobileView>
    </>
  );
};
