import { useLDClient } from 'launchdarkly-react-client-sdk';
import { AbsolutelyCentered, CircularProgress, Size } from 'nightwatch-ui';
import { FC, Suspense, useEffect, useState } from 'react';
import React from 'react';
import { MobileView } from 'react-device-detect';
import { Helmet } from 'react-helmet';
import {
  isReactNativeDesktopApp,
  isMobileApp,
  sendRNWebviewMsg,
  useCurrentUserData,
  BrowserDesktopView,
  useLocalSetting,
  storeRedirectInLocalStorage,
  lazyWithPreload,
  CALENDAR_REDIRECT_KEY
} from 'skiff-front-utils';
import { assertExists, StorageTypes } from 'skiff-utils';

import { useCreateCalendarUserMutation, useCurrentUserLazyQuery } from '../../../generated/graphql';
import { getCurrentCalendarID } from '../../apollo/currentCalendarMetadata';
import { db, initializeDB } from '../../storage/db/db';
import { CalendarMetadataDB } from '../../storage/models/CalendarMetadata';
import { useDefaultCalendarView } from '../../utils/hooks/useCalendarView';
import useFetchCurrentUser from '../../utils/hooks/useFetchCurrentUser';
import { CalendarSettings } from '../CalendarSettings';

const CalendarGlobalHotkeys = lazyWithPreload(() => import('../CalendarGlobalHotKeys'));

import MobileLayout from './MobileLayout';
import WebLayout from './WebLayout';

const spinner = (
  <AbsolutelyCentered>
    <CircularProgress size={Size.LARGE} spinner />
  </AbsolutelyCentered>
);

const PRIMARY_CALENDAR_ID_LOCATION = 0;

const Layout: FC = ({ children }) => {
  const [createCalendarUser] = useCreateCalendarUserMutation();
  const [fetch] = useCurrentUserLazyQuery();
  const { isCachedLoginSuccessful, isCachedLoginDone } = useFetchCurrentUser();
  const { defaultCalendarViewLoading } = useDefaultCalendarView();

  const [dbInitialized, setDbInitialized] = useState(false);
  const userData = useCurrentUserData();
  const privateUserData = userData?.privateUserData;
  const ldClient = useLDClient();

  const [, setHasSeenCalendar] = useLocalSetting(StorageTypes.HAS_SEEN_CALENDAR);

  useEffect(() => {
    void Promise.all([CalendarGlobalHotkeys.preload()]);
  }, []);

  useEffect(() => {
    if (userData && ldClient) {
      void ldClient.identify({ key: userData.userID });
    }
  }, [userData, ldClient]);

  useEffect(() => {
    /**
     * There's only a primary calendar as of now.
     * When more are added, this should be
     * changed to support that.
     */
    const updateMetadataWithCalendar = async () => {
      if (!userData || !privateUserData) return;
      if (!userData.calendars || userData.calendars.length === 0 || !userData.primaryCalendar) {
        assertExists(userData.publicKey.signature);
        await createCalendarUser({
          variables: {
            request: {
              signingPublicKey: { key: userData.signingPublicKey },
              publicKey: {
                key: userData.publicKey.key,
                signature: userData.publicKey.signature
              },
              calendarPublicKey: userData.publicKey.key
            }
          }
        });
        await fetch();
        return;
      }

      await initializeDB(userData.userID, userData.primaryCalendar.calendarID);
      setDbInitialized(true);

      const calendarID = getCurrentCalendarID();
      const selectedCalendar = userData.calendars[PRIMARY_CALENDAR_ID_LOCATION];
      const isCalendarSameAsDB = calendarID === selectedCalendar.calendarID;

      if (isCalendarSameAsDB) return;

      await CalendarMetadataDB.updateMetadata({
        calendarID: selectedCalendar.calendarID,
        publicKey: selectedCalendar.publicKey,
        encryptedPrivateKey: selectedCalendar.encryptedPrivateKey || undefined,
        encryptedByKey: selectedCalendar.encryptedByKey
      });
      if (db) {
        // When we update calendar on localDB we dont want to wait for the next sync interval
        void db.fireEventUpdate();
      }
    };
    void updateMetadataWithCalendar();
  }, [createCalendarUser, userData?.userID, fetch, privateUserData]);

  useEffect(() => {
    if (!userData?.userID || (!isMobileApp() && !isReactNativeDesktopApp())) {
      // After logging in, record that the user has seen calendar in local storage
      // This controls the Calendar intro toast in the other products
      setHasSeenCalendar(true);
      return;
    }
    sendRNWebviewMsg('loaded', { isLoggedIn: !!userData });
  }, [userData?.userID, setHasSeenCalendar]);

  // Show loading state until user is logged in and local db is initialized
  // most of the app is dependent on the local db being initialized
  // Also show loading state if the default calendar view hasn't been fetched yet
  if (!userData?.userID || !dbInitialized || defaultCalendarViewLoading) {
    // only redirect back to editor if the user is not logged in.
    // other errors shouldn't redirect back to prevent an infinite loop.
    // TODO
    if (isCachedLoginDone && !isCachedLoginSuccessful) {
      storeRedirectInLocalStorage(CALENDAR_REDIRECT_KEY);
      window.location.href = '/';
    }
    return spinner;
  }

  return (
    <>
      <MobileView>
        <MobileLayout>{children}</MobileLayout>
      </MobileView>
      <BrowserDesktopView>
        <Helmet>
          <title>Skiff – Calendar</title>
        </Helmet>
        <WebLayout isLoggedIn={!!userData}>{children}</WebLayout>
      </BrowserDesktopView>
      <CalendarSettings />
      <Suspense fallback={null}>
        <CalendarGlobalHotkeys />
      </Suspense>
    </>
  );
};

export default Layout;
