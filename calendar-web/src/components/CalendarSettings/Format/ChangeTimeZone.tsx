import { DropdownItem, FilledVariant, Size } from 'nightwatch-ui';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  TitleActionSection,
  stringifyTimeZone,
  renderCustomLabel,
  uniqueTimezones,
  SelectField,
  timeZoneIncludesQuery,
  TIME_ZONE_PICKER_MAX_HEIGHT,
  TIME_ZONE_PICKER_WIDTH
} from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';

import { DrawerTypes, mobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';
import { timeReducer } from '../../../redux/reducers/timeReducer';
import { useAppSelector, useLocalSetting } from '../../../utils';

export const ChangeTimeZone = () => {
  const [timeZone, setTimeZone] = useLocalSetting(StorageTypes.TIME_ZONE);
  const dispatch = useDispatch();
  const { selectedViewDate } = useAppSelector((state) => state.time);
  const changeSelectedTimeTimezone = (newTimeZone: string) =>
    dispatch(timeReducer.actions.setSelectedViewDate(selectedViewDate.tz(newTimeZone)));

  const customWidth = !isMobile ? TIME_ZONE_PICKER_WIDTH : undefined;
  const openDrawer = () => dispatch(mobileDrawerReducer.actions.openDrawer(DrawerTypes.ChangeTimeZone));
  const closeDrawer = () => dispatch(mobileDrawerReducer.actions.closeDrawer(DrawerTypes.ChangeTimeZone));
  const isMobileDrawerOpen = !!useAppSelector((state) =>
    state.mobileDrawer.openDrawers?.includes(DrawerTypes.ChangeTimeZone)
  );

  // Validates the inputted search value against a given time zone
  const customSearchValidator = (timeZoneName: string, searchValue: string) => {
    const timeZoneObject = uniqueTimezones.find((tz) => tz.name === timeZoneName);
    return !!timeZoneObject && timeZoneIncludesQuery(timeZoneObject, searchValue);
  };

  const renderCustomContent = () => (
    <SelectField
      fullWidth
      maxHeight={TIME_ZONE_PICKER_MAX_HEIGHT}
      menuControls={{
        isOpen: isMobileDrawerOpen,
        setIsOpen: (isOpen) => {
          if (isOpen) openDrawer();
          else closeDrawer();
        }
      }}
      onChange={(value: string) => {
        setTimeZone(value);
        changeSelectedTimeTimezone(value);
      }}
      searchProps={{ enableSearch: true, customSearchValidator }}
      size={Size.SMALL}
      value={timeZone}
      variant={FilledVariant.FILLED}
      width={customWidth}
    >
      {uniqueTimezones.map((tz) => (
        <DropdownItem
          active={timeZone === tz.name}
          customLabel={renderCustomLabel(tz)}
          key={tz.name}
          label={stringifyTimeZone(tz)}
          value={tz.name}
        />
      ))}
    </SelectField>
  );

  return (
    <TitleActionSection
      actions={[
        {
          type: 'custom',
          content: renderCustomContent()
        }
      ]}
      subtitle='Choose a time zone for your calendar'
      title='Time zone'
    />
  );
};
