import { ParamList } from 'ical';
import isURL from 'validator/lib/isURL';

import { CONFERENCE_KEY } from './constants';

const stripKey = (key: string) => key.replace('X-', '');

export const extractConference = (event: { [prop: string]: string | ParamList | undefined }) => {
  const conference = event[stripKey(CONFERENCE_KEY)];
  if (conference && typeof conference === 'string' && isURL(conference)) return conference;
};
