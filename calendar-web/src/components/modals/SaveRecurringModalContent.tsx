import { Typography } from 'nightwatch-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { RadioCheckbox } from 'skiff-front-utils';
import styled, { css } from 'styled-components';

import { useCurrentCalendarID } from '../../apollo/currentCalendarMetadata';
import { RADIO_BUTTON_CLASS_NAME } from '../../constants/calendar.constants';
import { SaveDraftModalRecurringAction } from '../../redux/reducers/modalTypes';
import { DecryptedDraft } from '../../storage/models/draft/types';
import { DecryptedEvent } from '../../storage/models/event/types';

const RadioOptionsContainer = styled.div<{ $mobile: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;

  ${({ $mobile }) =>
    $mobile
      ? css`
          margin: 24px 16px;
        `
      : css`
          margin: 12px 0px;
        `}
`;

const RadioWithLabelContainer = styled.div`
  display: flex;
  gap: 16px;
  height: 36px;
  align-items: center;
  cursor: pointer;
`;

const RadioWithLabel = ({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) => {
  return (
    <RadioWithLabelContainer className={RADIO_BUTTON_CLASS_NAME} onClick={onClick}>
      <RadioCheckbox
        checked={checked}
        onClick={(e) => {
          // prevent the modal from off-clicking
          e.stopPropagation();
          e.preventDefault();
          onClick();
        }}
      />
      <Typography>{label}</Typography>
    </RadioWithLabelContainer>
  );
};

interface SaveRecurringModalContentProps {
  saveDraftModalRecurringAction: SaveDraftModalRecurringAction;
  setSaveDraftModalRecurringAction: (action: SaveDraftModalRecurringAction) => void;
  onSave: (action: SaveDraftModalRecurringAction) => void;
  event: DecryptedEvent | null;
  draft: DecryptedDraft | null;
  isReadOnly: boolean;
  changeInRecurrenceRule: boolean;
  isParentEvent: boolean;
  isLastRecurrence: boolean;
  isDelete: boolean;
}

export const SaveRecurringModalContent = ({
  event,
  draft,
  saveDraftModalRecurringAction,
  setSaveDraftModalRecurringAction,
  changeInRecurrenceRule,
  isParentEvent,
  isReadOnly,
  isLastRecurrence,
  isDelete
}: SaveRecurringModalContentProps) => {
  const calendarID = useCurrentCalendarID();
  const userIsCreatorOfRecurrence = calendarID === (event || draft)?.plainContent.creatorCalendarID;

  if (!draft && !event) return null;

  return (
    <RadioOptionsContainer $mobile={isMobile}>
      {(!changeInRecurrenceRule || isDelete) && (
        <RadioWithLabel
          checked={saveDraftModalRecurringAction === SaveDraftModalRecurringAction.ThisEvent}
          label='Only this event'
          onClick={() => setSaveDraftModalRecurringAction(SaveDraftModalRecurringAction.ThisEvent)}
        />
      )}
      {!isParentEvent && !isLastRecurrence && userIsCreatorOfRecurrence && !isReadOnly && (
        <RadioWithLabel
          checked={saveDraftModalRecurringAction === SaveDraftModalRecurringAction.ThisAndFutureEvents}
          label='This and all future events'
          onClick={() => setSaveDraftModalRecurringAction(SaveDraftModalRecurringAction.ThisAndFutureEvents)}
        />
      )}
      <RadioWithLabel
        checked={saveDraftModalRecurringAction === SaveDraftModalRecurringAction.AllEvents}
        label='All events'
        onClick={() => setSaveDraftModalRecurringAction(SaveDraftModalRecurringAction.AllEvents)}
      />
    </RadioOptionsContainer>
  );
};
