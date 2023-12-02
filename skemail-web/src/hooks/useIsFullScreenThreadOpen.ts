import { useLocation } from 'react-router-dom';
import { useMediaQuery, useUserPreference } from 'skiff-front-utils';
import { SystemLabels, ThreadDisplayFormat } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';

import { FULL_VIEW_BREAKPOINT } from '../constants/mailbox.constants';

import { useThreadActions } from './useThreadActions';

export const useIsFullScreenThreadOpen = () => {
  const [threadFormat] = useUserPreference(StorageTypes.THREAD_FORMAT);
  // need noSsr in useMediaQuery to avoid the first render returning isCompact as false
  const isCompact = useMediaQuery(`(max-width:${FULL_VIEW_BREAKPOINT}px)`, { noSsr: true });
  const { activeThreadID } = useThreadActions();
  const location = useLocation();
  const isDrafts = location.pathname.includes(SystemLabels.Drafts.toLowerCase());
  // Is the side panel open
  const messageDetailsPanelOpen = !isDrafts && !!activeThreadID;
  return messageDetailsPanelOpen && (threadFormat === ThreadDisplayFormat.Full || isCompact);
};
