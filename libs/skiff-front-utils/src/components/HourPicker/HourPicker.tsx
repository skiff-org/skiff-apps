import { Dayjs } from 'dayjs';
import debounce from 'lodash/debounce';
import { getThemedColor, ThemeMode, Typography, TypographySize } from 'nightwatch-ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { getInitialDateObject, TimeFormat } from './hourPickerUtils';

// 12 - 11
const TWELVE_HOUR_LIST = ['12', ...Array.from({ length: 11 }, (_, i) => String(i + 1))];
// 0 - 23
const TWENTY_FOUR_HOUR_LIST = Array.from({ length: 24 }, (_, i) => String(i));

const TIME_DIVIDERS = ['AM', 'PM'];

const getMinutes = (interval = 1) =>
  Array.from({ length: 60 / interval }, (_, i) => i * interval).map((n) => String(n).padStart(2, '0'));

/**
 * @type
 * get the current item's index and the current selected item's index.
 * needed to decide which item gets different color (based on selection)
 * basic usage `(i,currentSelectedIndex) => i === currentSelectedIndex` will color
 * the selected item differently.
 */
type CompareFunction = (i: number, currentSelectedIndex: number) => boolean;
const VISIBLE_ITEM_COUNT = 7;
// Move 7 to be a const - consider to have it as a prop and default 7
const Container = styled.div<{ height: number }>`
  height: ${(props) => props.height * VISIBLE_ITEM_COUNT}px;
  position: relative;
  isolation: isolate;
  scrollbar-width: none;
  display: flex;
  justify-content: center;
`;

const SCROLL_CONTAINER_LEFT_PADDING = 12;

const ScrollContainer = styled.div<{ $height: number; $rightPadding: number }>`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  width: fit-content;

  // Needs to be padding and NOT margin to register as scrollable area
  padding: 0 ${(props) => props.$rightPadding}px 0 ${SCROLL_CONTAINER_LEFT_PADDING}px;

  // IMPORTANT: This z-index must be HIGHER than HighlightedSection
  z-index: 9999;

  &::-webkit-scrollbar {
    display: none;
  }

  // enables reaching to the top and bottom containers.
  &::before,
  &::after {
    display: inline-block;
    width: 1px;
    content: '';
    // each padding is the size of two items and with that you can cover width of 4 items and
    // show the first and last items
    padding: ${(props) =>
      `${props.$height * 2}px ${props.$rightPadding}px ${props.$height * 2}px ${SCROLL_CONTAINER_LEFT_PADDING}px`};
  }
`;

const ScrollItem = styled.div<{ height: number }>`
  scroll-snap-align: center;
  display: flex;
  justify-content: center;
  align-items: center;

  flex: 0 0 ${(props) => props.height}px;
`;

const HighlightedSection = styled.div<{ $forceTheme: ThemeMode; $height: number }>`
  height: ${(props) => props.$height}px;
  position: absolute;
  width: 100%;
  border-radius: 999px;
  background-color: ${(props) => getThemedColor('var(--bg-field-default) ', props.$forceTheme)};
  top: 50%;
  transform: translateY(-50%);

  // IMPORTANT: This z-index must be LOWER than ScrollContainer
  z-index: 1;
`;

const GradientBackground = styled.div<{ $forceTheme: ThemeMode }>`
  pointer-events: none;
  box-shadow: inset 0 0 25px 25px ${(props) => getThemedColor('var(--bg-l3-solid)', props.$forceTheme)};
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
`;

export interface HourPickerProps {
  // Control the hour container height
  itemHeight: number;
  onChange: (value: string) => void;
  timeFormat: TimeFormat;
  initialHour?: Dayjs | null;
  minuteInterval?: number;
  onChangeDebounceInterval?: number;
  forceTheme: ThemeMode;
}

interface ScrollableSelectWheelProps<T> {
  // list of items that you want to scroll through.
  scrollList: Array<T>;
  // the height of each item in the list in pixels.
  itemHeight: number;
  // function that triggered when value is changed.
  onChange: (value: T) => void;
  // Needs to be padding and NOT margin to register as scrollable area
  paddingRight?: number;
  // A list of compare functions
  compareCbs?: CompareFunction[];
  initialValue?: string;
  forceTheme: ThemeMode;
}

const getInitialScrollIndex = (initialValue: string | undefined, scrollList: string[]) => {
  if (!initialValue || !scrollList.find((item) => item === initialValue)) return 0;
  return scrollList.findIndex((item) => item === initialValue) + 1;
};

const ScrollableSelectWheel = ({
  scrollList,
  itemHeight,
  onChange,
  paddingRight,
  compareCbs,
  initialValue,
  forceTheme
}: ScrollableSelectWheelProps<string>) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(getInitialScrollIndex(initialValue, scrollList));

  useEffect(() => {
    // To initiate with the initialValue, we first check if it exists,
    // and exists in the list.
    // if so, we get the amount of scroll we need to do based on the index of the
    // value in the list.
    if (!initialValue || !scrollList.find((item) => item === initialValue) || !scrollRef.current) return;
    const initialValueIndex = getInitialScrollIndex(initialValue, scrollList);
    const amountToScroll = initialValueIndex * itemHeight;
    scrollRef.current.scrollTop = amountToScroll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue, itemHeight]);

  const onScroll = () => {
    if (!scrollRef || !scrollRef.current) return;

    const selectedScroll = scrollRef.current.scrollTop;
    const newIndex = Math.floor(selectedScroll / itemHeight - 0.5);
    // scroll event is fired every scroll, to avoid over-changing the state,
    // we check if the current index has changed.
    // before and after pseudo elements can change the index because of their height,
    // we eliminate that by check if the index is inside the acceptable index range ( 1 - scrollList.length)
    if (currentIndex !== newIndex && newIndex >= 0 && newIndex < scrollList.length) {
      setCurrentIndex(newIndex);
      onChange(scrollList[newIndex]);
    }
  };

  /**
   * This function returns the text color of the item
   * based on the result of the compare functions.
   * @param i the index of the item
   * @param compareFunctions list of compare functions
   * @returns 'primary' if on of the compare functions is true, and 'disabled' if not.
   */
  const getColor = (i: number, compareFunctions?: CompareFunction[]) => {
    if (!compareFunctions) return 'disabled';

    if (compareFunctions.find((compareFunction) => compareFunction(i, currentIndex))) {
      return 'primary';
    }
    return 'disabled';
  };

  return (
    <ScrollContainer $height={itemHeight} $rightPadding={paddingRight ?? 12} onScroll={onScroll} ref={scrollRef}>
      {scrollList.map((item, i) => {
        return (
          <ScrollItem height={itemHeight} key={item}>
            <Typography
              color={getColor(i, compareCbs)}
              forceTheme={forceTheme}
              size={TypographySize.LARGE}
              transition='color 0.3s'
            >
              {item.padStart(2, '0')}
            </Typography>
          </ScrollItem>
        );
      })}
    </ScrollContainer>
  );
};

const hourOrMinuteCompareFunctions: CompareFunction[] = [
  (i, currentSelectedIndex) => currentSelectedIndex === i,
  (i, currentSelectedIndex) => currentSelectedIndex - 1 === i,
  (i, currentSelectedIndex) => currentSelectedIndex + 1 === i
];

const AMPMCompareFunctions: CompareFunction[] = [(i, currentSelectedIndex) => currentSelectedIndex === i];

export const HourPicker = ({
  itemHeight,
  onChange,
  initialHour,
  timeFormat,
  minuteInterval,
  onChangeDebounceInterval = 300,
  forceTheme
}: HourPickerProps) => {
  const is12HourFormat = timeFormat.includes('A'); // If out format includes AM-PM
  const initialDateObject = useRef(getInitialDateObject(is12HourFormat, initialHour, timeFormat));
  const [hour, setHour] = useState<string | undefined>(initialDateObject.current.hour);
  const [minute, setMinute] = useState<string | undefined>(initialDateObject.current.minute);
  const [timeDivider, setTimeDivider] = useState<string | undefined>(initialDateObject.current.timeDivider);
  const MINUTES = useMemo(() => getMinutes(minuteInterval), [minuteInterval]);

  const debouncedHourChanges = useCallback(debounce(onChange, onChangeDebounceInterval), [onChange]);

  useEffect(() => {
    if (initialHour) {
      const formatted = initialHour.format(timeFormat);
      // If the hour set is not 00,
      // remove the first 0 and take the number of hour.
      initialDateObject.current.hour =
        formatted.split(':')[0].startsWith('0') && formatted.split(':')[0] !== '00'
          ? formatted.split(':')[0][1]
          : formatted.split(':')[0];
      initialDateObject.current.minute = formatted.split(':')[1].split(' ')[0];
      if (is12HourFormat) {
        initialDateObject.current.timeDivider = formatted.split(' ')[1];
      }
    }
  }, [initialHour, timeFormat, is12HourFormat]);

  useEffect(() => {
    if (!hour || !minute) return;
    if (is12HourFormat && !!timeDivider) debouncedHourChanges(`${hour}:${minute} ${timeDivider}`);
    else if (!is12HourFormat) debouncedHourChanges(`${hour}:${minute}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour, is12HourFormat, minute, timeDivider]);

  const getHourList = () =>
    is12HourFormat
      ? // For the 12-hour format, return the 12-11 list
        TWELVE_HOUR_LIST
      : // For the 24-hour format, return the 0-23 list
        TWENTY_FOUR_HOUR_LIST;

  return (
    <Container height={itemHeight}>
      <ScrollableSelectWheel
        compareCbs={hourOrMinuteCompareFunctions}
        forceTheme={forceTheme}
        initialValue={initialDateObject.current.hour}
        itemHeight={itemHeight}
        onChange={setHour}
        scrollList={getHourList()}
      />
      <ScrollableSelectWheel
        compareCbs={hourOrMinuteCompareFunctions}
        forceTheme={forceTheme}
        initialValue={initialDateObject.current.minute}
        itemHeight={itemHeight}
        onChange={setMinute}
        paddingRight={20}
        scrollList={MINUTES}
      />
      {/* on 24 hour format we don`t need the AMPM section */}
      {is12HourFormat && (
        <ScrollableSelectWheel
          compareCbs={AMPMCompareFunctions}
          forceTheme={forceTheme}
          initialValue={initialDateObject.current.timeDivider}
          itemHeight={itemHeight}
          onChange={setTimeDivider}
          paddingRight={20}
          scrollList={TIME_DIVIDERS}
        />
      )}
      <HighlightedSection $forceTheme={forceTheme} $height={itemHeight} />
      <GradientBackground $forceTheme={forceTheme} />
    </Container>
  );
};
