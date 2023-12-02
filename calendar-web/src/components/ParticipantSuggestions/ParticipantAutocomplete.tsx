import Paper from '@mui/material/Paper';
import { themeNames } from 'nightwatch-ui';
import { REMOVE_SCROLLBAR_CSS } from 'nightwatch-ui';
import styled from 'styled-components';

import { AUTOCOMPLETE_ID, AUTOCOMPLETE_PAPER_CLASS } from '../../constants/calendar.constants';
import { EventAttendeeType } from '../../storage/models/event/types';

import { ParticipantRow, ParticipantRowType } from './ParticipantRow';
import { ParticipantAutocompleteProps } from './ParticipantsSuggestions.types';
const AutocompletePaper = styled(Paper)`
  margin-top: 6px;
  background: var(--bg-emphasis) !important;
  box-shadow: var(--shadow-l2) !important;
  border: 1px solid ${themeNames.light['--border-secondary']} !important;
  box-sizing: border-box !important;
  border-radius: 8px !important;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 4px !important;
  position: absolute;
  top: 100%;
  width: 100%;
  max-height: 400px;
  overflow-y: scroll;
  overflow-x: hidden;
  z-index: 9999;
  ${REMOVE_SCROLLBAR_CSS}
`;

const AutocompleteOption = styled.li`
  list-style-type: none;
  width: 100%;
  box-sizing: border-box !important;
  cursor: pointer;
  border-radius: 8px;
  padding: 8px 0;
  gap: 8px;
  :hover,
  &.Mui-focused {
    background: ${themeNames.dark['--bg-cell-hover']};
  }
`;

const AutocompleteListbox = styled.ul`
  list-style-type: none;
  padding: 0px;
  margin: 0px;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const ParticipantAutocomplete = (props: ParticipantAutocompleteProps) => {
  const { getListboxProps, getOptionProps, submitParticipant, groupedOptions, calendarID, autocompeteRef } = props;

  return (
    <AutocompletePaper className={AUTOCOMPLETE_PAPER_CLASS} id={AUTOCOMPLETE_ID} ref={autocompeteRef}>
      <AutocompleteListbox {...getListboxProps()}>
        {groupedOptions.map((option, index) => {
          const { color, onClick: onOptionClick, ...optionProps } = getOptionProps({ option, index });
          return (
            <AutocompleteOption key={option.email} onClick={() => submitParticipant(option)} {...optionProps}>
              <ParticipantRow
                inAutoComplete
                isCurrentUser={option.type === EventAttendeeType.InternalAttendee && option.calendarID === calendarID}
                participant={option}
                participantRowType={ParticipantRowType.IsCompact}
              />
            </AutocompleteOption>
          );
        })}
      </AutocompleteListbox>
    </AutocompletePaper>
  );
};

export default ParticipantAutocomplete;
