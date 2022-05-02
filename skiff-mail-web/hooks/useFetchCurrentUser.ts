import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useCurrentUserData } from '../apollo/currentUser';
import { ALLOWED_UNAUTHENTICATED_ROUTES } from '../constants/route.constants';
import { useCurrentUserQuery } from '../generated/graphql';
import { skemailDraftsReducer } from '../redux/reducers/draftsReducer';
import { getUserDrafts } from '../utils/draftUtils';
import { getEditorBasePath } from '../utils/linkToEditorUtils';
import { tryCachedLogin } from './useCachedLogin';

const useFetchCurrentUser = () => {
  const { data, loading: queryLoading, error } = useCurrentUserQuery();
  const router = useRouter();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

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
    // Redirect to login page if unauthenticated
    if (!isLoggedIn && !ALLOWED_UNAUTHENTICATED_ROUTES.has(router.pathname)) {
      window.location.replace(getEditorBasePath());
      // Redirect to inbox if authenticated
    } else if (isLoggedIn && ALLOWED_UNAUTHENTICATED_ROUTES.has(router.pathname)) {
      void router.push('/inbox');
    }
  }, [isLoggedIn, isLoading, router]);

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
