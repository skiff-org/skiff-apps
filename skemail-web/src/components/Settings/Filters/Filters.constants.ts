// The gap between the options dropdown and the label within the FilterConditionChip

import { DatagramV2 } from 'skiff-crypto';

import {
  FilterSerializedDataHeader,
  FilterSerializedDataBody
} from '../../../../../../libs/skiff-mail-protos/dist/src';
import { BodyTextDatagram, SubjectTextDatagram } from '../../../crypto/filters';

// For example, this is used to add a gap between the condition type label + condition type dropdown
export const DROPDOWN_ANCHOR_GAP = 2;

/******** Styling constants ***********/
export const FILTER_CONDITION_CHIP_HEIGHT = 24;
// Padding for the left/right ends of the condition chip
export const FILTER_CONDITION_CHIP_EDGE_PADDING = 4;
// Padding for the left/right sides of the text within the chip
export const CHIP_TYPOGRAPHY_PADDING = 8;

/******** Enums ***********/
export enum ConditionType {
  To = 'TO',
  From = 'FROM',
  Subject = 'SUBJECT',
  Body = 'BODY'
}

export enum ConditionComparator {
  Is = 'IS',
  Has = 'HAS',
  IsNot = 'IS NOT'
}

export enum MarkAsType {
  Unread = 'UNREAD',
  Read = 'READ'
}

export enum FilterType {
  And = 'AND',
  Or = 'OR'
}

export enum FilterChipDropdown {
  Type = 'TYPE',
  Comparator = 'COMPARATOR',
  Value = 'VALUE'
}

export const FRONTEND_CONDITION_TYPES = [ConditionType.Subject, ConditionType.Body];

export const ENCRYPTED_CONDITION_TYPES_TO_DATAGRAM: Partial<{
  [key in ConditionType]: DatagramV2<FilterSerializedDataHeader, FilterSerializedDataBody>;
}> = {
  [ConditionType.Subject]: SubjectTextDatagram,
  [ConditionType.Body]: BodyTextDatagram
};

export const CONDITION_TYPE_TO_LABEL: { [key in ConditionType]: string } = {
  [ConditionType.From]: 'From',
  [ConditionType.To]: 'To/CC/BCC',
  [ConditionType.Subject]: 'Subject',
  [ConditionType.Body]: 'Body'
};

export const CONDITION_TYPE_TO_COMPARATORS: { [key in ConditionType]: ConditionComparator[] } = {
  [ConditionType.From]: Object.values(ConditionComparator),
  [ConditionType.To]: Object.values(ConditionComparator),
  [ConditionType.Subject]: [ConditionComparator.Has],
  [ConditionType.Body]: [ConditionComparator.Has]
};
