import { useCallback } from 'react';
import { generatePath, useHistory } from 'react-router-dom';
import { SystemLabels } from 'skiff-graphql';

import { MailAppRoutes } from '../constants/route.constants';

export const useNavigate = () => {
  const history = useHistory();

  const navigateToSystemLabel = useCallback(
    /**
     * Use this function to navigate into a system label without triggering a complete rerender
     */
    (systemLabel: SystemLabels, search?: string) => {
      history.push({
        pathname: `${generatePath(MailAppRoutes.MAILBOX, {
          mailboxLabel: systemLabel.toLowerCase()
        })}`,
        search
      });
    },
    [history]
  );

  const navigateToUserLabel = useCallback(
    /**
     * Use this function to navigate into a user label without triggering a complete rerender
     */
    (userLabel: string) => {
      const encodedUserLabel = encodeURIComponent(userLabel.toLocaleLowerCase());
      history.push(`${MailAppRoutes.USER_LABEL_MAILBOX}#${encodedUserLabel}`);
    },
    [history]
  );

  const navigateToInbox = useCallback(() => {
    navigateToSystemLabel(SystemLabels.Inbox);
  }, [navigateToSystemLabel]);

  const navigateToSearch = useCallback(() => {
    history.push({
      pathname: MailAppRoutes.SEARCH
    });
  }, [history]);

  return { navigateToSystemLabel, navigateToUserLabel, navigateToInbox, navigateToSearch };
};

/**
 * this function returns the hashtag(#) param in
 * the url.
 * example: localhost:4200/mail/label#someLabel,
 * the hash param would be: `someLabel`
 * @param url the url string
 * @returns the hashtag(#) param in the url.
 */
export const extractHashParamFromURL = (url: string) => {
  return url.split('#')[1];
};
