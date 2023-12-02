import { Button, CircularProgress, Size, Type, Typography } from 'nightwatch-ui';
import React, { useEffect, useState } from 'react';
import { MobileView } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { GoogleLoginButton, useToast, BrowserDesktopView } from 'skiff-front-utils';
import styled from 'styled-components';

import { importReducer, ImportType } from '../../../redux/reducers/importReducer';
import { useAppSelector } from '../../../utils';
import {
  checkPermissionsToCalendarAndLogin,
  lazyLoadGapiScript,
  removeGapiScript,
  logoutCalendar
} from '../../../utils/gapi';
import { importGoogleCalendar } from '../../../utils/importGoogleCalendar';
import { useCloseSettings } from '../useOpenCloseSettings';

enum CalendarImportState {
  AUTHORIZATION,
  LOADING,
  LOGGED,
  ERROR,
  IMPORTING
}

const GoogleLoginButtonsContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
`;

type GoogleLoginProps = {
  back: () => void;
  handleAuth: () => void;
};

const GoogleLogin = ({ back, handleAuth }: GoogleLoginProps) => {
  return (
    <>
      <GoogleLoginButtonsContainer>
        <GoogleLoginButton dataTest='drive-sign-in' onClick={handleAuth} style={{ cursor: 'pointer', height: 42 }} />
        <Button fullWidth onClick={back} type={Type.SECONDARY}>
          Cancel
        </Button>
      </GoogleLoginButtonsContainer>
    </>
  );
};

const LoadingContainer = styled.div`
  display: flex;
  width: 100%;
  height: 40px;
  align-items: center;
  justify-content: center;
`;

const StyledBrowserView = styled(BrowserDesktopView)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  align-items: center;
`;

const StyledMobileView = styled(MobileView)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  align-items: center;
`;

type GCalImportDialogContentProps = {
  onClose: () => void | Promise<void>;
};

export const GCalImportDialogContent = (props: GCalImportDialogContentProps) => {
  const { onClose } = props;
  const [calendarImportState, setCalendarImportState] = useState<CalendarImportState>(
    CalendarImportState.AUTHORIZATION
  );
  const activeImportTypes = useAppSelector((app) => app.import.activeImport);
  const dispatch = useDispatch();

  const [isGapiScriptLoaded, setIsGapiScriptLoaded] = useState(false); // determine whether the gapi script has loaded

  const { enqueueToast } = useToast();

  const getCalendarPermission = async () => {
    const permissionGranted = await checkPermissionsToCalendarAndLogin(() =>
      setCalendarImportState(CalendarImportState.LOGGED)
    );
    if (!permissionGranted) {
      console.error('must grant permissions to calendar');
      setCalendarImportState(CalendarImportState.AUTHORIZATION);
    }
  };

  useEffect(() => {
    lazyLoadGapiScript(() => setIsGapiScriptLoaded(true));

    return () => {
      removeGapiScript(() => setIsGapiScriptLoaded(false));
      setCalendarImportState(CalendarImportState.AUTHORIZATION);
    };
  }, []);

  const handleAccountSwitch = async () => {
    await logoutCalendar();
    await getCalendarPermission();
  };

  const handleSignInClick = async () => {
    await getCalendarPermission();
  };

  const closeSettings = useCloseSettings();

  const handleImport = () => {
    setCalendarImportState(CalendarImportState.LOADING);
    dispatch(importReducer.actions.addActiveImport(ImportType.Google));
    void importGoogleCalendar().then(() => {
      void onClose();
      dispatch(importReducer.actions.removeActiveImport(ImportType.Google));
      enqueueToast({
        title: 'Import finished',
        body: 'Successfully imported your Google calendar.'
      });
    });
    closeSettings();
  };

  let content = <Typography>Something went wrong please try again...</Typography>;

  switch (calendarImportState) {
    case CalendarImportState.AUTHORIZATION:
      content = <GoogleLogin back={() => void onClose()} handleAuth={() => void handleSignInClick()} />;
      break;
    case CalendarImportState.LOGGED:
      content = (
        <>
          <StyledMobileView>
            <Button key='cancel' onClick={onClose} type={Type.DESTRUCTIVE}>
              Cancel
            </Button>
            <Button key='import' onClick={handleImport} type={Type.PRIMARY}>
              Import
            </Button>
          </StyledMobileView>
          <StyledBrowserView>
            <Button fullWidth key='import' onClick={handleImport} type={Type.PRIMARY}>
              Import Calendar
            </Button>
            <Button fullWidth key='switch-account' onClick={handleAccountSwitch} type={Type.SECONDARY}>
              Switch Account
            </Button>
            <Button fullWidth key='cancel' onClick={onClose} type={Type.DESTRUCTIVE}>
              Cancel
            </Button>
          </StyledBrowserView>
        </>
      );
      break;
  }

  if (
    activeImportTypes.includes(ImportType.Google) ||
    calendarImportState === CalendarImportState.LOADING ||
    !isGapiScriptLoaded
  ) {
    content = (
      <LoadingContainer>
        <CircularProgress size={Size.LARGE} spinner />
      </LoadingContainer>
    );
  }

  return content;
};
