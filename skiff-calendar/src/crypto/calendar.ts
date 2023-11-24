import { Range } from 'semver';
import { stringDecryptAsymmetric, stringEncryptAsymmetric } from 'skiff-crypto';
import { createProtoWrapperDatagramV2 } from 'skiff-crypto';

import { PublicKey } from '../../generated/graphql';
import {
  CalendarEventPreferencesBody,
  CalendarEventPreferencesHeader,
  EventBody,
  EventHeader
} from '../../generated/protos/com/skiff/calendar/encrypted/encrypted_data';

export const decryptPrivateCalendarKeyForUser = (
  encryptedPrivateCalendarKey: string,
  senderPublicKey: Pick<PublicKey, 'key'>,
  ownPrivateKey: string
) => stringDecryptAsymmetric(ownPrivateKey, senderPublicKey, encryptedPrivateCalendarKey);

export const encryptPrivateCalendarKeyForUser = (
  privateCalendarKey: string,
  receiverPublicKey: Pick<PublicKey, 'key'>,
  ownPrivateKey: string
) => stringEncryptAsymmetric(ownPrivateKey, receiverPublicKey, privateCalendarKey);

export const EventDatagram = createProtoWrapperDatagramV2(
  'skalendar.event',
  EventHeader,
  EventBody,
  '0.1.0',
  new Range('0.1.*')
);

export const CalendarEventPreferencesDatagram = createProtoWrapperDatagramV2(
  'skalendar.calendar_event_preferences',
  CalendarEventPreferencesHeader,
  CalendarEventPreferencesBody,
  '0.1.0',
  new Range('0.1.*')
);
