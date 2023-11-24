import { useLDClient } from 'launchdarkly-react-client-sdk';
import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { getEnvironment, getEditorBasePath } from 'skiff-front-utils';
import { isMobileApp, useCurrentUserData } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';

import { ALLOWED_UNAUTHENTICATED_ROUTES } from '../constants/route.constants';
import { skemailDraftsReducer } from '../redux/reducers/draftsReducer';
import { getUserDrafts } from '../utils/draftUtils';
import { useNavigate } from '../utils/navigation';

import { tryCachedLogin } from './useCachedLogin';

const useFetchCurrentUser = () => {
  const location = useLocation();
  const history = useHistory();
  const { navigateToSystemLabel } = useNavigate();
  const dispatch = useDispatch();
  const ldClient = useLDClient();
  const userData = useCurrentUserData();
  const isLoggedIn = !!userData;
  const [isCachedLoginSuccessful, setIsCachedLoginSuccessful] = useState(false);
  const [isCachedLoginDone, setIsCachedLoginDone] = useState(false);

  useEffect(() => {
    if (userData?.userID) {
      // if user is already logged in, no need to check for cached login
      return;
    }
    const updateVerifyState = async () => {
      const cacheLoginResult = await tryCachedLogin();
      setIsCachedLoginSuccessful(cacheLoginResult);
      setIsCachedLoginDone(true);
    };
    void updateVerifyState();
  }, [userData?.userID]);

  useEffect(() => {
    if (!isCachedLoginDone || !location) return;
    // If on mobile browser try deep link to mobile app
    // After auth with google
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('code') && isMobile && !isMobileApp()) {
      window.location.replace('skemail://' + window.location.href);
    }
    // Redirect to login page if unauthenticated
    if (!isLoggedIn) {
      const env = getEnvironment(new URL(window.location.origin));
      // If separate origins for editor and skemail (no shared cookies), direct to skemail login
      const editorAndSkemailSeparateOrigin = env === 'local' || env === 'review_app' || env === 'vercel';
      if (editorAndSkemailSeparateOrigin && !ALLOWED_UNAUTHENTICATED_ROUTES.has(location.pathname)) {
        history.push('/');
        // If same origins for editor and skemail (shared cookies), direct to editor login
      } else if (!editorAndSkemailSeparateOrigin && location.pathname !== 'signup') {
        window.location.replace(getEditorBasePath());
      }
      // Redirect to inbox if authenticated
    } else if (isLoggedIn && ALLOWED_UNAUTHENTICATED_ROUTES.has(location.pathname)) {
      // after logging to google we redirected with code query param, in this case keep them so we can use it later
      navigateToSystemLabel(SystemLabels.Inbox, window.location.search || undefined);
    }
  }, [isLoggedIn, location, history, navigateToSystemLabel, isCachedLoginDone]);

  useEffect(() => {
    if (userData && ldClient) {
      void ldClient.identify({ key: userData.userID });
    }
  }, [userData, ldClient]);

  useEffect(() => {
    const getDrafts = async () => {
      if (userData) {
        // Fetch drafts from IDB
        const drafts = await getUserDrafts(userData);
        dispatch(skemailDraftsReducer.actions.setDrafts({ drafts }));
      }
    };
    void getDrafts();
  }, [userData, dispatch]);

  return {
    isLoggedIn: !!userData,
    isCachedLoginSuccessful,
    isCachedLoginDone
  };
};

export default useFetchCurrentUser;
