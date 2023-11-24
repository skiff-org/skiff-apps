import { REMOVE_SCROLLBAR_CSS } from 'nightwatch-ui';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { AUTOCOMPLETE_PAPER_CLASS } from '../../constants/calendar.constants';
import { EventAttendeeType } from '../../storage/models/event/types';

import { ParticipantRow, ParticipantRowType } from './ParticipantRow';
import { ParticipantAutocompleteProps } from './ParticipantsSuggestions.types';

const INPUT_OFFSET = 28; // 16px padding + 12px margin we have on the input field

const Container = styled.div`
  position: absolute;
  z-index: 9999;
  background: var(--bg-l3-solid);
  margin-top: 12px;
  width: 100vw;
  transform: translateX(-${INPUT_OFFSET}px);
`;

const MobileOption = styled.li`
  padding: 0 20px;

  &.Mui-focused {
    background: var(--bg-cell-hover) !important;
  }

  &.Mui-focusVisible {
    background: var(--bg-cell-hover) !important;
  }
`;
const Listbox = styled.ul<{ $height: number }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow-y: scroll;
  padding: 0;
  margin: 0;
  height: 100%;
  min-height: ${({ $height }) => $height}px;
  list-style-type: none;
  ${REMOVE_SCROLLBAR_CSS}
`;

const MAX_DISPLAYED_OPTIONS = 7;

const MobileParticipantAutocomplete = (props: ParticipantAutocompleteProps) => {
  const { getListboxProps, getOptionProps, submitParticipant, groupedOptions, calendarID } = props;
  const [listBoxHeight, setListBoxHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const height = window.innerHeight - container.getBoundingClientRect().top;
      setListBoxHeight(height);
    }
  }, [containerRef]);
  return (
    <Container className={AUTOCOMPLETE_PAPER_CLASS} ref={containerRef}>
      <Listbox {...getListboxProps()} $height={listBoxHeight}>
        {groupedOptions.slice(0, MAX_DISPLAYED_OPTIONS).map((option, index) => {
          const { color, onClick: onOptionClick, ...optionProps } = getOptionProps({ option, index });
          return (
            <MobileOption key={option.email} onClick={() => submitParticipant(option)} {...optionProps}>
              <ParticipantRow
                inAutoComplete
                isCurrentUser={option.type === EventAttendeeType.InternalAttendee && option.calendarID === calendarID}
                participant={option}
                participantRowType={ParticipantRowType.IsCompact}
              />
            </MobileOption>
          );
        })}
      </Listbox>
    </Container>
  );
};

export default MobileParticipantAutocomplete;
