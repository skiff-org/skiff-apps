import { useEffect, useState } from 'react';
import { useCurrentUserData } from 'skiff-front-utils';

import { tryCachedLogin } from './useCachedLogin';

const useFetchCurrentUser = () => {
  const userData = useCurrentUserData();
  const [isCachedLoginSuccessful, setIsCachedLoginSuccessful] = useState(false);
  const [isCachedLoginDone, setIsCachedLoginDone] = useState(false);

  useEffect(() => {
    if (userData?.userID) {
      return;
    }
    const updateVerifyState = async () => {
      const cacheLoginResult = await tryCachedLogin();
      setIsCachedLoginSuccessful(cacheLoginResult);
      setIsCachedLoginDone(true);
    };
    void updateVerifyState();
  }, [userData?.userID]);

  return {
    isLoggedIn: !!userData,
    isCachedLoginSuccessful,
    isCachedLoginDone
  };
};

export default useFetchCurrentUser;
