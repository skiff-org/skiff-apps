import { useLDClient } from 'launchdarkly-react-client-sdk';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { getEnvironment, setDatadogUser, isDatadogRUMEnabled, getEditorBasePath } from 'skiff-front-utils';
import { isMobileApp } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import { useCurrentUserQuery } from 'skiff-mail-graphql';

import { useCurrentUserData } from '../apollo/currentUser';
import { ALLOWED_UNAUTHENTICATED_ROUTES } from '../constants/route.constants';
import { skemailDraftsReducer } from '../redux/reducers/draftsReducer';
import { getUserDrafts } from '../utils/draftUtils';
import { useNavigate } from '../utils/navigation';

import { tryCachedLogin } from './useCachedLogin';

const useFetchCurrentUser = () => {
  const { data, loading: queryLoading, error } = useCurrentUserQuery();
  const router = useRouter();
  const { navigateToSystemLabel } = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const ldClient = useLDClient();

  useEffect(() => {
    if (queryLoading) return;
    const updateVerifyState = async () => {
      await tryCachedLogin();
      setIsLoading(false);
    };
    void updateVerifyState();
  }, [data, queryLoading]);

  const user = useCurrentUserData();
  const isLoggedIn = !!user;
  useEffect(() => {
    if (isLoading || !router.isReady) return;
    // If on mobile browser try deep link to mobile app
    // After auth with google
    if (router.query.code && isMobile && !isMobileApp()) {
      window.location.replace('skemail://' + window.location.href);
    }
    // Redirect to login page if unauthenticated
    if (!isLoggedIn) {
      const env = getEnvironment(new URL(window.location.origin));
      // If separate origins for editor and skemail (no shared cookies), direct to skemail login
      const editorAndSkemailSeparateOrigin = env === 'local' || env === 'review_app' || env === 'vercel';
      if (editorAndSkemailSeparateOrigin && !ALLOWED_UNAUTHENTICATED_ROUTES.has(router.pathname)) {
        void router.push('/');
        // If same origins for editor and skemail (shared cookies), direct to editor login
      } else if (!editorAndSkemailSeparateOrigin && router.pathname !== 'signup') {
        window.location.replace(getEditorBasePath());
      }
      // Redirect to inbox if authenticated
    } else if (isLoggedIn && ALLOWED_UNAUTHENTICATED_ROUTES.has(router.pathname)) {
      if (!(typeof window === 'undefined')) {
        // Browser only
        if (isDatadogRUMEnabled()) {
          void setDatadogUser(user.userID);
        }
      }
      // after logging to google we redirected with code query param, in this case keep him so we can use it later
      if (router.query.code) {
        void navigateToSystemLabel(SystemLabels.Inbox, router.query);
      } else {
        void navigateToSystemLabel(SystemLabels.Inbox);
      }
    }
  }, [isLoggedIn, isLoading, router]);

  useEffect(() => {
    if (user && ldClient) {
      void ldClient.identify({ key: user.userID });
    }
  }, [user]);

  useEffect(() => {
    const getDrafts = async () => {
      if (user) {
        // Fetch drafts from IDB
        const drafts = await getUserDrafts(user);
        dispatch(skemailDraftsReducer.actions.setDrafts({ drafts }));
      }
    };
    void getDrafts();
  }, [user, dispatch]);

  return {
    isLoading,
    error,
    isLoggedIn
  };
};

export default useFetchCurrentUser;
