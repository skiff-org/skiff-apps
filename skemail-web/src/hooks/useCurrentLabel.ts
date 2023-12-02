import { useEffect, useMemo, useState } from 'react';
import { matchPath, useParams } from 'react-router-dom';
import { UserLabelVariant } from 'skiff-graphql';

import { MailAppRoutes } from '../constants/route.constants';
import {
  ALIAS_LABEL_URL_PARAM,
  FOLDER_URL_PARAM,
  getHiddenLabelFromPathParams,
  getSystemLabelFromPathParams
} from '../utils/label';

interface MailboxPathParams {
  mailboxLabel: string;
}

// Get current label from path params
export const useCurrentLabel = () => {
  const { hash, search, pathname } = window.location;
  const params = useMemo(() => new URLSearchParams(search), [search]);

  const { mailboxLabel: mailboxLabelFromRoute } = useParams<MailboxPathParams>();
  // Also try matchPath as a fallback -- sometimes useParams is empty for valid routes
  const routeMatch = matchPath<MailboxPathParams>(pathname, {
    path: `${MailAppRoutes.MAIL}${MailAppRoutes.MAILBOX}`
  });
  const routeLabel = mailboxLabelFromRoute || routeMatch?.params.mailboxLabel;

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

  // Handles switching WITHIN labels or folders
  useEffect(() => {
    const labelFromHash = decodeURIComponent(hash.slice(hash.indexOf('#') + 1));
    if (userLabel !== labelFromHash) {
      setUserLabel(labelFromHash);
    }
  }, [hash, userLabel]);

  // Handles switching BETWEEN labels or folders
  useEffect(() => {
    let updatedVariant: UserLabelVariant | null = null;
    if (params.get(FOLDER_URL_PARAM)) updatedVariant = UserLabelVariant.Folder;
    else if (params.get(ALIAS_LABEL_URL_PARAM)) updatedVariant = UserLabelVariant.Alias;
    else if (pathname.includes(MailAppRoutes.USER_LABEL_MAILBOX)) updatedVariant = UserLabelVariant.Plain;
    if (updatedVariant !== userLabelVariant) {
      setUserLabelVariant(updatedVariant);
    }
  }, [params, pathname, userLabelVariant]);

  const hiddenLabel = !!routeLabel ? getHiddenLabelFromPathParams(routeLabel) : undefined;
  if (hiddenLabel) {
    return { label: hiddenLabel, userLabelVariant: null };
  }

  const systemLabel = !!routeLabel ? getSystemLabelFromPathParams(routeLabel) : undefined;
  if (systemLabel) {
    return { label: systemLabel, userLabelVariant: null };
  }

  return {
    label: userLabel,
    userLabelVariant: userLabel ? userLabelVariant : null,
    activeAliasInbox: userLabelVariant === UserLabelVariant.Alias ? userLabel ?? '' : undefined
  };
};
