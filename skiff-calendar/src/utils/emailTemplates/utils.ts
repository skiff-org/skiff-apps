import dayjs from 'dayjs';
import { HourFormats, VerbalDayDateMonth } from 'skiff-front-utils';
import { AttendeeStatus, SendAddressRequest } from 'skiff-graphql';
import { assert } from 'skiff-utils';

import { DecryptedEvent } from '../../storage/models/event/types';
import { getAttendeeStatusByAddress } from '../attendeeUtils';
import { dateToFormatString } from '../dateTimeUtils';

import { RsvpUpdateEmailSubjectByStatus } from './constants';

export const getRsvpEmailTitle = (event: DecryptedEvent, fromAddress: SendAddressRequest) => {
  const status = getAttendeeStatusByAddress(event, fromAddress.address);
  assert(status !== AttendeeStatus.Pending, "Can't send email with pending status");

  const statusSubject = RsvpUpdateEmailSubjectByStatus[status];
  const startDateFormatted = dateToFormatString(dayjs(event.plainContent.startDate), VerbalDayDateMonth);
  const startTimeFormatted = dateToFormatString(dayjs(event.plainContent.startDate), HourFormats.Long);

  return `${statusSubject} - ${event.decryptedContent.title} / ${startDateFormatted} / ${startTimeFormatted}`;
};
