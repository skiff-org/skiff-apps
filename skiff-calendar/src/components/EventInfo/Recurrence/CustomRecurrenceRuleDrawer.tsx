import { Dayjs } from 'dayjs';
import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Drawer, useTheme } from 'skiff-front-utils';
import { RecurrenceRule } from 'skiff-ics';

import { DrawerTypes, mobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';
import { useAppSelector } from '../../../utils';

import { CustomRecurrenceRuleContent } from './CustomRecurrenceRuleModal';

interface CustomRuleDrawerProps {
  startDate: Dayjs;
  updateRecurrence: (recurrenceRule: RecurrenceRule | null) => Promise<void>;
  currentRRule?: RecurrenceRule | null;
  isAllDay: boolean;
}

export const CustomRuleDrawer = ({ currentRRule, startDate, updateRecurrence, isAllDay }: CustomRuleDrawerProps) => {
  const { theme } = useTheme();
  const openDrawers = useAppSelector((state) => state.mobileDrawer.openDrawers);
  const dispatch = useDispatch();

  const open = useMemo(() => !!openDrawers?.includes(DrawerTypes.CustomRecurrenceRule), [openDrawers]);
  const hideDrawer = () => {
    dispatch(mobileDrawerReducer.actions.closeDrawer(DrawerTypes.CustomRecurrenceRule));
  };

  return (
    <Drawer
      extraSpacer={false}
      forceTheme={theme}
      hideDrawer={hideDrawer}
      maxHeight='95vh'
      show={open}
      title='Customize recurring event'
    >
      <CustomRecurrenceRuleContent
        closeCustomRule={hideDrawer}
        currentRRule={currentRRule}
        isAllDay={isAllDay}
        startDate={startDate}
        updateRecurrence={updateRecurrence}
      />
    </Drawer>
  );
};
