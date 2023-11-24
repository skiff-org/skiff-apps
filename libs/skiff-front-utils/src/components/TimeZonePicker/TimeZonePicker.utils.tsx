import { getTimeZones, TimeZone } from '@vvo/tzdb';
import { Typography, ThemeMode, themeNames } from 'nightwatch-ui';
import styled from 'styled-components';

const TimeDiffContainer = styled.span`
  font-size: 14px;
  font-family: 'Skiff Mono', system-ui;
  color: ${themeNames.dark['--text-secondary']};
  margin-right: 8px;
  font-variant-numeric: tabular-nums lining-nums;
`;

const CityName = styled.span`
  color: ${themeNames.dark['--text-secondary']};
  margin-left: 8px;
`;

export const uniqueTimezones = getTimeZones();

const getCityNameForTZ = (tz: TimeZone) => tz.name.split('/')[1].replace(/\_/g, ' ');

// GMT-XX:XX City abbrev
export const stringifyTimeZone = (currTimeZone: TimeZone) =>
  `GMT${currTimeZone.currentTimeFormat.split(' ')[0]} / ${currTimeZone.alternativeName} / ${getCityNameForTZ(
    currTimeZone
  )}`;

export const renderCustomLabel = (currTimeZone: TimeZone) => {
  return (
    <Typography forceTheme={ThemeMode.DARK}>
      <TimeDiffContainer>GMT{currTimeZone.currentTimeFormat.split(' ')[0]}</TimeDiffContainer>
      <span>{currTimeZone.alternativeName}</span>
      <CityName>{getCityNameForTZ(currTimeZone)}</CityName>
    </Typography>
  );
};

/** Checks whether the given time zone includes the given query */
export const timeZoneIncludesQuery = (tz: TimeZone, query: string) => {
  const { abbreviation, name, alternativeName, countryName, mainCities } = tz;
  const comparableQuery = query.toLowerCase();

  return (
    abbreviation.toLowerCase().includes(comparableQuery) ||
    name.toLowerCase().includes(comparableQuery) ||
    alternativeName.toLowerCase().includes(comparableQuery) ||
    countryName.toLowerCase().includes(comparableQuery) ||
    mainCities.some((city: string) => city.toLowerCase().includes(comparableQuery))
  );
};
