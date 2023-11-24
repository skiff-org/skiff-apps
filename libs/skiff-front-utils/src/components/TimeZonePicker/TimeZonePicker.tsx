import { Dropdown, DropdownItem, InputField, REMOVE_SCROLLBAR_CSS } from 'nightwatch-ui';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { TIME_ZONE_PICKER_MAX_HEIGHT, TIME_ZONE_PICKER_WIDTH } from './TimeZonePicker.constants';
import { TimeZonePickerProps } from './TimeZonePicker.types';
import { renderCustomLabel, stringifyTimeZone, timeZoneIncludesQuery, uniqueTimezones } from './TimeZonePicker.utils';

const ScrollContainer = styled.div<{ $fixedHeight: boolean }>`
  width: 100%;
  overflow-y: auto;
  max-height: ${TIME_ZONE_PICKER_MAX_HEIGHT}px;
  ${({ $fixedHeight }) => $fixedHeight && `height: ${TIME_ZONE_PICKER_MAX_HEIGHT}px;`}
  ${REMOVE_SCROLLBAR_CSS}
`;

const TimeZonePicker: React.FC<TimeZonePickerProps> = ({
  buttonRef,
  isOpen,
  timeZone,
  onSelectTimeZone,
  setIsOpen,
  fixedHeight = false,
  ...dropdownProps
}: TimeZonePickerProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [highlightedIdx, setHighlightedIdx] = useState<number>(0);

  const filteredTimeZones = useMemo(
    () =>
      uniqueTimezones.filter(
        (tz) =>
          timeZoneIncludesQuery(tz, searchValue) ||
          stringifyTimeZone(tz).toLowerCase().includes(searchValue.toLowerCase())
      ),
    [searchValue]
  );

  useEffect(() => {
    if (isOpen) {
      // Highlight active item on opening the dropdown
      const activeIndex = uniqueTimezones.findIndex((tz) => tz.name === timeZone);
      if (activeIndex === highlightedIdx) return;
      setHighlightedIdx(activeIndex);
    } else {
      // Reset search value on closing the dropdown
      if (!!searchValue.length) setSearchValue('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <Dropdown
      buttonRef={buttonRef}
      inputField={<InputField onChange={(e) => setSearchValue(e.target.value)} value={searchValue} />}
      keyboardNavControls={{
        idx: highlightedIdx,
        setIdx: setHighlightedIdx,
        numItems: filteredTimeZones.length
      }}
      portal
      setShowDropdown={setIsOpen}
      showDropdown={isOpen}
      width={TIME_ZONE_PICKER_WIDTH}
      {...dropdownProps}
    >
      <ScrollContainer $fixedHeight={fixedHeight}>
        {filteredTimeZones.map((tz, index) => (
          <DropdownItem
            active={timeZone === tz.name}
            customLabel={renderCustomLabel(tz)}
            highlight={highlightedIdx === index}
            key={tz.name}
            label={stringifyTimeZone(tz)}
            onClick={() => {
              onSelectTimeZone(tz.name);
              setIsOpen(false);
            }}
            onHover={() => setHighlightedIdx(index)}
          />
        ))}
      </ScrollContainer>
    </Dropdown>
  );
};

export default TimeZonePicker;
