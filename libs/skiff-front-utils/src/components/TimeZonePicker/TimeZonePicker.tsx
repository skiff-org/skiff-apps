import { getTimeZones, TimeZone } from '@vvo/tzdb';
import { Typography, ThemeMode, themeNames } from '@skiff-org/skiff-ui';
import styled from 'styled-components';

export const TimeDiffContainer = styled.span`
  font-size: 14px;
  font-family: 'Skiff Mono', system-ui;
  color: ${themeNames.dark['--text-secondary']};
  margin-right: 8px;
  font-variant-numeric: tabular-nums lining-nums;
`;

export const CityName = styled.span`
  color: ${themeNames.dark['--text-secondary']};
  margin-left: 8px;
`;

export const uniqueTimezones = getTimeZones();

const getCityNameFotTZ = (tz: TimeZone) => tz.name.split('/')[1].replace(/\_/g, ' ');

// GMT-XX:XX City abbrev
export const stringifyTimeZone = (currTimeZone: TimeZone) =>
  `GMT${currTimeZone.currentTimeFormat.split(' ')[0]} / ${currTimeZone.alternativeName} / ${getCityNameFotTZ(
    currTimeZone
  )}`;

export const renderCustomLabel = (currTimeZone: TimeZone) => {
  return (
    <Typography forceTheme={ThemeMode.DARK}>
      <TimeDiffContainer>GMT{currTimeZone.currentTimeFormat.split(' ')[0]}</TimeDiffContainer>
      <span>{currTimeZone.alternativeName}</span>
      <CityName>{getCityNameFotTZ(currTimeZone)}</CityName>
    </Typography>
  );
};
