import { plainMockEvent } from '../../tests/mocks/encryptedEvent';
import { HOUR_UNIT } from '../constants/time.constants';
import { DecryptedEvent } from '../storage/models/event/types';

import { dayjs, hasStartTimeChanged } from './dateTimeUtils';

const eventData: DecryptedEvent = plainMockEvent({ decryptedContent: { isAllDay: false } });

describe('Date and time utils test', () => {
  it('Determine if the start time of event has changed - changed', () => {
    const res = hasStartTimeChanged(eventData, {
      plainContent: {
        startDate: dayjs(eventData.plainContent.startDate).add(1, HOUR_UNIT).valueOf(),
        endDate: dayjs(eventData.plainContent.endDate).add(1, HOUR_UNIT).valueOf()
      }
    });

    expect(res).toBe(true);
  });
  it('Determine if the start time of event has changed - not changed', () => {
    const res = hasStartTimeChanged(eventData, {
      plainContent: {
        endDate: dayjs(eventData.plainContent.endDate).add(1, HOUR_UNIT).valueOf()
      }
    });
    expect(res).toBe(false);
  });
  it('Determine if the start time of event has changed - changed to all day event', () => {
    const res = hasStartTimeChanged(eventData, { decryptedContent: { isAllDay: true } });
    expect(res).toBe(true);
  });
});
