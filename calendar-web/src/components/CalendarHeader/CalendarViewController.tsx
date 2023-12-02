import { Dropdown, DropdownItem, FilledVariant, Icon, IconText, Size } from 'nightwatch-ui';
import React, { FC, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { KeyCodeSequence } from 'skiff-front-utils';
import { CalendarView } from 'skiff-graphql';
import { upperCaseFirstLetter } from 'skiff-utils';

import { calendarReducer } from '../../redux/reducers/calendarReducer';
import { useCurrentCalendarView } from '../../utils/hooks/useCalendarView';
import { CALENDAR_VIEW_SHORTCUT } from '../CalendarGlobalHotKeys';

const CALENDAR_VIEW_DROPDOWN_WIDTH = 151;
const CALENDAR_VIEW_DROPDOWN_GAP_FROM_ANCHOR = 8;

export const CalendarViewController: FC = () => {
  const dispatch = useDispatch();
  const { currCalendarView } = useCurrentCalendarView();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState<number>(0);

  const buttonRef = useRef<HTMLDivElement | null>(null);

  const calendarViewArray = [CalendarView.Weekly, CalendarView.Monthly];
  const renderDropdownItems = () =>
    calendarViewArray.map((view, i) => (
      <DropdownItem
        endElement={<KeyCodeSequence shortcut={CALENDAR_VIEW_SHORTCUT[view]} size={Size.SMALL} />}
        highlight={highlightedIdx === i}
        key={view as string}
        label={upperCaseFirstLetter(view as string)}
        onClick={() => {
          if (view !== currCalendarView) dispatch(calendarReducer.actions.setCalendarView(view));
          setIsDropdownOpen(false);
        }}
        onHover={() => setHighlightedIdx(i)}
      />
    ));

  return (
    <>
      <IconText
        endIcon={Icon.ChevronDown}
        label={upperCaseFirstLetter(currCalendarView as string)}
        onClick={() => {
          setIsDropdownOpen(true);
          // Highlight current active view
          const activeViewIndex = calendarViewArray.indexOf(currCalendarView);
          setHighlightedIdx(activeViewIndex);
        }}
        ref={buttonRef}
        variant={FilledVariant.FILLED}
      />
      <Dropdown
        buttonRef={buttonRef}
        gapFromAnchor={CALENDAR_VIEW_DROPDOWN_GAP_FROM_ANCHOR}
        keyboardNavControls={{
          idx: highlightedIdx,
          numItems: calendarViewArray.length,
          setIdx: setHighlightedIdx
        }}
        portal
        setShowDropdown={setIsDropdownOpen}
        showDropdown={isDropdownOpen}
        width={CALENDAR_VIEW_DROPDOWN_WIDTH}
      >
        {renderDropdownItems()}
      </Dropdown>
    </>
  );
};
