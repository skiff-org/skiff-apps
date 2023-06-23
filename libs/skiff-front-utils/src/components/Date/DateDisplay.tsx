// TODO: This file is copied from react-client. Solve tsc / composite issues.

import dayjs from 'dayjs';
import RelativeTimePlugin from 'dayjs/plugin/relativeTime';
import UpdateLocalePlugin from 'dayjs/plugin/updateLocale';
import { Typography, TypographySize, Color } from '@skiff-org/skiff-ui';
import React from 'react';

import { DateInputFormats } from '../../constants';
import useTimedRerender from '../../hooks/useTimedRerender';
import useUserPreference from '../../hooks/useUserPreference';

dayjs.extend(RelativeTimePlugin);
dayjs.extend(UpdateLocalePlugin);
dayjs.updateLocale('en', {
  relativeTime: { ...dayjs.Ls.en.relativeTime, s: 'just now' }
});

interface DateDisplayProps {
  value: string | number | Date | dayjs.Dayjs;
  type?: 'absolute' | 'relative';
  displayTime?: boolean;
  displayDate?: boolean;
  color?: Color;
  size?: TypographySize;
}

export const getDateContent = (
  value: string | number | Date | dayjs.Dayjs,
  dateFormat: DateInputFormats,
  hourFormat: '12' | '24',
  type = 'relative',
  displayTime = true,
  displayDate = true
) => {
  const now = dayjs();
  const dateValue = dayjs(value);

  // https://day.js.org/docs/en/display/format
  const absoluteDateFormat = [displayDate && dateFormat, displayTime && (hourFormat === '12' ? 'h:mm a' : 'HH:mm')]
    .filter(Boolean)
    .join(' ');

  const absoluteDateString = dateValue.format(absoluteDateFormat);

  // remove suffix "___ ago"  or "in ___" if the time is "just now"
  const withoutSuffix = Math.abs(dateValue.diff(now, 'minute', true)) < 1;
  const relativeDateString = dateValue.isBefore(now)
    ? dateValue.fromNow(withoutSuffix)
    : dateValue.from(now, withoutSuffix);

  return type === 'absolute' ? absoluteDateString : relativeDateString;
};

const DateDisplay: React.FC<DateDisplayProps> = ({
  value,
  type = 'relative',
  displayTime = true,
  displayDate = true,
  color,
  size
}: DateDisplayProps) => {
  const [dateFormat] = useUserPreference('dateFormat');
  const [hourFormat] = useUserPreference('hourFormat');

  useTimedRerender(60_000, type === 'absolute'); // updates every minute
  const content = getDateContent(value, dateFormat, hourFormat, type, displayTime, displayDate);

  const contentElement = (
    <Typography color={color} mono size={size}>
      {content}
    </Typography>
  );

  return contentElement;
};

export default DateDisplay;
