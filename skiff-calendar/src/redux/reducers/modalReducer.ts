import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { isMobile } from 'react-device-detect';
import { BannerTypes, isReactNativeDesktopApp } from 'skiff-front-utils';

import { CalendarModal } from './modalTypes';

export interface CalendarModalReducerState {
  bannersOpen: BannerTypes[];
  openModal?: CalendarModal;
}

const isSS = typeof window !== 'object'; // Is on server side

const initialCalendarModalReducerState: CalendarModalReducerState = {
  bannersOpen: !isMobile && !isSS && !isReactNativeDesktopApp() ? [BannerTypes.Mobile] : []
};

export const modalReducer = createSlice({
  name: 'modal',
  initialState: initialCalendarModalReducerState,
  reducers: {
    setOpenModal: (state, action: PayloadAction<CalendarModal | undefined>) => {
      state.openModal = action.payload;
    },
    openBanner: (state, action: PayloadAction<BannerTypes>) => {
      const addBanner = action.payload;
      state.bannersOpen = [...state.bannersOpen.filter((banner) => banner !== addBanner), addBanner];
    },
    closeBanner: (state, action: PayloadAction<BannerTypes>) => {
      const removeBanner = action.payload;
      state.bannersOpen = state.bannersOpen.filter((banner) => banner !== removeBanner);
    }
  }
});
