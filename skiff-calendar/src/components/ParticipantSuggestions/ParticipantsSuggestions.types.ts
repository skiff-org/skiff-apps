import { RefObject } from 'react';

import { EventAttendee } from '../../storage/models/event/types';

export interface ParticipantRowAction {
  label: string;
  onClick: (e?: React.MouseEvent) => void | Promise<void>;
  key: string;
  alert?: boolean;
}
export type ParticipantActions = { [key: string]: ParticipantRowAction[] };

export interface ParticipantAutocompleteProps {
  submitParticipant: (participant: EventAttendee) => void;
  groupedOptions: EventAttendee[];
  calendarID: string;
  getListboxProps: () => React.HTMLAttributes<HTMLUListElement>;
  getOptionProps: ({ option, index }: { option: EventAttendee; index: number }) => React.HTMLAttributes<HTMLLIElement>;
  autocompeteRef?: RefObject<HTMLDivElement>;
}
