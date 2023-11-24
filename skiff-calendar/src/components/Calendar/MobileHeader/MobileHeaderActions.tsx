import { FilledVariant, Icon, Icons, IconText } from 'nightwatch-ui';
import React, { Dispatch, SetStateAction, useCallback } from 'react';
import { SettingsSection, TabPage } from 'skiff-front-utils';
import { CalendarView } from 'skiff-graphql';
import styled from 'styled-components';

import { MOBILE_CALENDAR_VIEW_LABEL } from '../../../constants/calendar.constants';
import { useCurrentCalendarView } from '../../../utils/hooks/useCalendarView';
import useJumpToDate from '../../../utils/hooks/useJumpToDate';
import { useOpenSettings } from '../../CalendarSettings/useOpenCloseSettings';

const IconsContainer = styled.div`
  display: flex;
  margin-left: auto;
  gap: 8px;
`;

const StyledViewButton = styled(IconText)`
  width: 32px;
`;

interface MobileHeaderActionsProps {
  setIsMiniMonthOpen: Dispatch<SetStateAction<boolean>>;
}

const MobileHeaderActions: React.FC<MobileHeaderActionsProps> = ({ setIsMiniMonthOpen }: MobileHeaderActionsProps) => {
  // Custom hooks
  const { jumpToToday } = useJumpToDate();
  const { currCalendarView, setCurrCalendarView } = useCurrentCalendarView();
  const openSettings = useOpenSettings();

  const openSettingsDrawer = useCallback(
    () => openSettings({ indices: { tab: TabPage.Appearance, section: SettingsSection.SkiffCalendar } }),
    [openSettings]
  );

  const toggleCurrCalendarView = () => {
    if (currCalendarView === CalendarView.Weekly) {
      // Change to Monthly
      setCurrCalendarView(CalendarView.Monthly);
      // Close mini month view on opening Monthly view
      setIsMiniMonthOpen(false);
    } else {
      // Change to Weekly
      setCurrCalendarView(CalendarView.Weekly);
    }
  };

  return (
    <IconsContainer>
      {/* Open settings */}
      <IconText onClick={openSettingsDrawer} startIcon={<Icons icon={Icon.Settings} size={18} />} />
      {/* Toggle calendar view */}
      <StyledViewButton
        disableHover
        fullWidth
        label={MOBILE_CALENDAR_VIEW_LABEL[currCalendarView].charAt(0)}
        onClick={toggleCurrCalendarView}
        variant={FilledVariant.FILLED}
      />
      {/* Go to today */}
      <IconText disableHover label='Today' onClick={jumpToToday} variant={FilledVariant.FILLED} />
    </IconsContainer>
  );
};

export default MobileHeaderActions;
