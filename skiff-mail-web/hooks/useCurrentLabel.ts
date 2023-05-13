import isString from 'lodash/isString';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { UserLabelVariant } from 'skiff-graphql';

import { AppRoutes } from '../constants/route.constants';
import { ALIAS_LABEL_URL_PARAM, FOLDER_URL_PARAM, getLabelFromPathParams } from '../utils/label';

// Get current label from path params
export const useCurrentLabel = () => {
  const router = useRouter();
  const { hash, search } = window.location;
  const params = new URLSearchParams(search);

  const getInitialUserLabelVariant = () => {
    // If there is no hash this is not a valid user label
    if (!hash) return null;
    if (params.get(FOLDER_URL_PARAM) === 'true') return UserLabelVariant.Folder;
    if (params.get(ALIAS_LABEL_URL_PARAM) === 'true') return UserLabelVariant.Alias;
    return UserLabelVariant.Plain;
  };
  const initialUserLabel = hash.length ? decodeURIComponent(hash.slice(1)) : null;
  const [userLabel, setUserLabel] = useState(initialUserLabel);
  const [userLabelVariant, setUserLabelVariant] = useState<UserLabelVariant | null>(getInitialUserLabelVariant());

  // Update userLabel when hash changes
  useEffect(() => {
    const setNewLabel = (url: string) => {
      const labelFromHash = decodeURIComponent(url.slice(url.indexOf('#') + 1));
      setUserLabel(labelFromHash);
    };

    // handles switching WITHIN labels or folders
    const onHashChangeStart = (url: string) => {
      setNewLabel(url);
    };

    // handles switching BETWEEN labels and folders (/label <-> /label?folder=true)
    const onRouteChangeStart = (url: string) => {
      let updatedVariant: UserLabelVariant | null = null;
      if (url.includes(FOLDER_URL_PARAM)) updatedVariant = UserLabelVariant.Folder;
      else if (url.includes(ALIAS_LABEL_URL_PARAM)) updatedVariant = UserLabelVariant.Alias;
      else if (url.includes(AppRoutes.LABEL)) updatedVariant = UserLabelVariant.Plain;

      setUserLabelVariant(updatedVariant);
      setNewLabel(url);
    };

    router.events.on('hashChangeStart', onHashChangeStart);
    router.events.on('routeChangeStart', onRouteChangeStart);

    return () => {
      router.events.off('hashChangeStart', onHashChangeStart);
      router.events.off('routeChangeStart', onRouteChangeStart);
    };
  }, [router.events, userLabelVariant]);

  if (isString(router.query.systemLabel)) {
    const label = getLabelFromPathParams(router.query.systemLabel);
    if (label) return { label, userLabelVariant: null };
  }

  return {
    label: userLabel,
    userLabelVariant: userLabel ? userLabelVariant : null,
    activeAliasInbox: userLabelVariant === UserLabelVariant.Alias ? userLabel ?? '' : undefined
  };
};
