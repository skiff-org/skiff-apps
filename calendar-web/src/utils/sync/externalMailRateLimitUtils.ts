import { GraphQLError } from 'graphql';
import toNumber from 'lodash/toNumber';

import { isApolloLogicErrorType, RateLimitError } from '../../../generated/graphql';
import { MS_UNIT } from '../../constants/time.constants';
import { dayjs } from '../dateTimeUtils';
export const EXTERNAL_EMAIL_SENDING_COOLDOWN = 'skiff:external_mail_cooldown:';
export const EXTERNAL_EMAIL_SENDING_THROTTLED = 'skiff:mail_throttled:';

const generateEmailCooldownStorageKey = (calendarID: string) => EXTERNAL_EMAIL_SENDING_COOLDOWN + calendarID;
const generateEmailThrottleStorageKey = (calendarID: string) => EXTERNAL_EMAIL_SENDING_THROTTLED + calendarID;

const generateDateFromCooldown = (cooldownInMs: number) => dayjs().add(cooldownInMs, MS_UNIT).valueOf().toString();

export const setNextDateToSendMail = (cooldownInMs: number, calendarID: string, throttled?: boolean) => {
  const uniqueKey = generateEmailCooldownStorageKey(calendarID);
  const dateFromCooldown = generateDateFromCooldown(cooldownInMs);
  localStorage.setItem(uniqueKey, dateFromCooldown);
  if (throttled) localStorage.setItem(generateEmailThrottleStorageKey(calendarID), dateFromCooldown);
  return uniqueKey;
};

export const getNextDateToSendMail = (key: string) => {
  const cooldownForId = localStorage.getItem(key);
  if (!cooldownForId) return 0;
  return toNumber(cooldownForId);
};

export const handleRateLimitError = (sendEmailErrors: GraphQLError[], calendarID: string) => {
  if (sendEmailErrors.length === 1) {
    for (const err of sendEmailErrors) {
      if (isApolloLogicErrorType(err, RateLimitError)) {
        const { msBeforeNext, throttled } = err.extensions;
        const existingCooldown = getNextDateToSendMail(calendarID);
        // if the user passed the existing cooldown and received a new one
        if (!dayjs().isSameOrBefore(existingCooldown)) {
          setNextDateToSendMail(msBeforeNext, calendarID, throttled);
        }
      }
    }
  }
};

export const reachedRateLimit = (calendarID: string) => {
  const existingCooldown = getNextDateToSendMail(generateEmailCooldownStorageKey(calendarID));
  return dayjs().isSameOrBefore(existingCooldown);
};

export const isThrottled = (calendarID: string) => {
  const throttledCooldown = getNextDateToSendMail(generateEmailThrottleStorageKey(calendarID));
  return dayjs().isSameOrBefore(throttledCooldown);
};
