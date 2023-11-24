import dayjs from 'dayjs';
import { CALENDAR_PATH } from 'skiff-front-utils';
import { DateInputFormats, HourFormats } from 'skiff-front-utils';
import { AttendeeStatus, SendAddressRequest } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';

import { formatRecurrenceRuleText } from '../../components/EventInfo/Recurrence/utils';
import { DecryptedEvent, EmailTypes } from '../../storage/models/event/types';
import { getEmailAddressesForAllAttendees, getEventOwnerMetadata } from '../../storage/models/event/utils';
import { getAttendeeStatusByAddress } from '../attendeeUtils';
import { dateToFormatString } from '../dateTimeUtils';
import { abbreviateHourFormat, getLocalSettingCurrentValue } from '../index';
import { isRecurringParent } from '../recurringUtils';

import {
  DEFAULT_EVENT_COLOR,
  DEFAULT_TITLE_COLOR,
  DELETE_EVENT_COLOR,
  DELETE_TITLE_COLOR,
  RsvpColorByStatus,
  RsvpContentHeadingByStatus
} from './constants';
import { HTML_EMAIL_TEMPLATE } from './template_html';

// The intention behind implementing this as a class is to promote extensibility.
// If the templates
export class EmailTemplateGenerator {
  emailType: EmailTypes;

  heading?: string;

  event: DecryptedEvent;

  fromAddress: SendAddressRequest;

  public constructor(emailType: EmailTypes, event: DecryptedEvent, fromAddress: SendAddressRequest, heading?: string) {
    this.emailType = emailType;
    this.event = event;
    this.heading = heading;
    this.fromAddress = fromAddress;
  }

  private getBaseTemplateVariables(): {
    title: string;
    eventTime: string;
    eventOwnerEmailAddress: string;
    attendeesEmailAddresses: string[];
    // following template values are calculated based on member variables
    totalNumberOfAttendees: number;
    numberOfHiddenAttendeeEmailAddresses: () => number;
    rsvpColor: string;
    heading: string | (() => string);
    titleColor: string;
    eventBorderColor: string;
    showRSVPStatus: boolean;
    link: string;
    recurrenceRule: string;
    attendeeAliasDeleted: boolean;
    deletedAlias: string;
  } {
    const userPreferredTimezone = getLocalSettingCurrentValue(StorageTypes.TIME_ZONE);
    const { displayName, email } = getEventOwnerMetadata(this.event)[0];
    const attendeesEmailAddresses = getEmailAddressesForAllAttendees(this.event);

    const startDate = dateToFormatString(dayjs(this.event.plainContent.startDate), DateInputFormats.MonthDayYear);
    const endDate = dateToFormatString(dayjs(this.event.plainContent.endDate), DateInputFormats.MonthDayYear);
    const isSameDay = startDate === endDate;

    const startTimeFormat = abbreviateHourFormat(
      this.event.plainContent.startDate,
      HourFormats.Long,
      userPreferredTimezone,
      this.event.plainContent.endDate
    );
    const endTimeFormat = abbreviateHourFormat(this.event.plainContent.endDate, HourFormats.Complete);

    const startTime = dateToFormatString(
      dayjs(this.event.plainContent.startDate).tz(userPreferredTimezone),
      startTimeFormat
    );
    const endTime = dateToFormatString(dayjs(this.event.plainContent.endDate).tz(userPreferredTimezone), endTimeFormat);

    const status = getAttendeeStatusByAddress(this.event, this.fromAddress.address);
    const isDelete = this.emailType === EmailTypes.GlobalDelete;

    let eventTime = '';
    if (this.event.decryptedContent.isAllDay && isSameDay) {
      eventTime = startDate;
    } else if (this.event.decryptedContent.isAllDay) {
      eventTime = `${startDate} - ${endDate}`;
    } else if (isSameDay) {
      eventTime = `${startDate} ${startTime} - ${endTime}`;
    } else {
      eventTime = `${startDate} ${startTime} - ${endTime} ${endDate}`;
    }

    // month starts at 0, so need to +1 for link
    return {
      title: this.event.decryptedContent.title ? this.event.decryptedContent.title : 'Untitled Event',
      eventTime,
      link: `${location.origin}/${CALENDAR_PATH}/${dayjs(this.event.plainContent.startDate).year()}/${
        dayjs(this.event.plainContent.startDate).month() + 1
      }/${dayjs(this.event.plainContent.startDate).date()}`,
      rsvpColor: status === AttendeeStatus.Pending ? '' : RsvpColorByStatus[status],
      eventOwnerEmailAddress: email,
      attendeesEmailAddresses: attendeesEmailAddresses,
      // following template values are calculated based on member variables
      totalNumberOfAttendees: attendeesEmailAddresses.length + 1,
      numberOfHiddenAttendeeEmailAddresses: () => {
        if (attendeesEmailAddresses.length > 3) {
          return attendeesEmailAddresses.length - 3;
        }
        return 0;
      },
      heading: this.heading
        ? this.heading
        : () => {
            // TODO: arpeetk - split this out into its own function
            switch (this.emailType) {
              case EmailTypes.Invite:
                return 'You are invited to an event';
              case EmailTypes.Uninvite:
                return 'You are uninvited from an event';
              case EmailTypes.Update:
                return `${displayName} has updated the event`;
              case EmailTypes.GlobalDelete:
                return `${displayName} has deleted the event`;
              case EmailTypes.RSVP:
                return `${this.fromAddress.name || this.fromAddress.address} ${
                  status === AttendeeStatus.Pending ? '' : RsvpContentHeadingByStatus[status]
                }`;
              case EmailTypes.AliasDeleted:
                return `${this.fromAddress.name || this.fromAddress.address} ${
                  RsvpContentHeadingByStatus[AttendeeStatus.No]
                }`;
            }
          },
      titleColor: isDelete ? DELETE_TITLE_COLOR : DEFAULT_TITLE_COLOR,
      eventBorderColor: isDelete ? DELETE_EVENT_COLOR : DEFAULT_EVENT_COLOR,
      showRSVPStatus: this.emailType === EmailTypes.RSVP || this.emailType === EmailTypes.AliasDeleted,
      recurrenceRule: isRecurringParent(this.event)
        ? formatRecurrenceRuleText(this.event.plainContent.recurrenceRule?.toText(), 0)
        : '',
      attendeeAliasDeleted: this.emailType === EmailTypes.AliasDeleted,
      // this is relevant only if `attendeeAliasDeleted` is true
      deletedAlias: this.fromAddress.address
    };
  }

  async generate() {
    const templateFileContent = HTML_EMAIL_TEMPLATE;
    const Handlebars = await import('handlebars');
    const template = Handlebars.compile(templateFileContent);
    const templateVariables = this.getBaseTemplateVariables();
    return template(templateVariables);
  }
}
