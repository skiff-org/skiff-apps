import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { DrawerTypes, mobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';

import { useAppSelector } from './useAppSelector';

export const useMobileDrawer = (drawerType: DrawerTypes) => {
  const dispatch = useDispatch();

  const openDrawer = useCallback(() => {
    dispatch(mobileDrawerReducer.actions.openDrawer(drawerType));
  }, [dispatch, drawerType]);

  const closeDrawer = useCallback(() => {
    dispatch(mobileDrawerReducer.actions.closeDrawer(drawerType));
  }, [dispatch, drawerType]);

  const isOpen = !!useAppSelector((state) => state.mobileDrawer.openDrawers?.includes(drawerType));

  return {
    openDrawer,
    closeDrawer,
    isOpen
  };
};
