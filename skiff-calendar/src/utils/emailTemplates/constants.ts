import { AttendeeStatus } from 'skiff-graphql';

export const DEFAULT_TITLE_COLOR = '#000000';
export const DELETE_TITLE_COLOR = '#D72828';
export const DEFAULT_EVENT_COLOR = 'rgba(0, 0, 0, 0.1)';
export const DELETE_EVENT_COLOR = 'rgba(215, 40, 40, 0.2)';

export const RsvpContentHeadingByStatus = {
  [AttendeeStatus.Yes]: 'accepted this invitation',
  [AttendeeStatus.No]: 'declined this invitation',
  [AttendeeStatus.Maybe]: 'marked attendance as maybe'
};

export const RsvpUpdateEmailSubjectByStatus = {
  [AttendeeStatus.Yes]: 'Accepted',
  [AttendeeStatus.No]: 'Declined',
  [AttendeeStatus.Maybe]: 'Maybe'
};

export const RsvpColorByStatus = {
  [AttendeeStatus.Yes]: '#00A05E',
  [AttendeeStatus.No]: '#D72828',
  [AttendeeStatus.Maybe]: '#EF5A3C'
};
