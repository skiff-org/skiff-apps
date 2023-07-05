import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useGetThreadFromIdQuery } from 'skiff-front-graphql';
import { useDefaultEmailAlias, useRequiredCurrentUserData, useCurrentUserEmailAliases } from 'skiff-front-utils';

import { skemailModalReducer } from '../redux/reducers/modalReducer';
import { UserLabelPlain, userLabelFromGraphQL } from '../utils/label';

import { useDrafts } from './useDrafts';
import { useThreadActions } from './useThreadActions';
import { useUserSignature } from './useUserSignature';

export function useActiveThreadActions() {
  const dispatch = useDispatch();
  const { userID } = useRequiredCurrentUserData();
  const { composeNewDraft } = useDrafts();
  const [defaultEmailAlias] = useDefaultEmailAlias(userID);
  const emailAliases = useCurrentUserEmailAliases();
  const userSignature = useUserSignature();

  const { activeThreadID } = useThreadActions();
  const { data: threadData } = useGetThreadFromIdQuery({
    variables: { threadID: activeThreadID || '' },
    skip: !activeThreadID
  });

  const email = useMemo(
    () => threadData?.userThread?.emails[threadData?.userThread?.emails.length - 1],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeThreadID, threadData]
  );

  /** reply to the last email in the thread */
  const reply = () => {
    if (!email || !threadData?.userThread) return;
    composeNewDraft();
    dispatch(
      skemailModalReducer.actions.replyCompose({
        email,
        thread: threadData.userThread,
        emailAliases,
        defaultEmailAlias,
        signature: userSignature
      })
    );
  };

  /** reply all to the last email in the thread */
  const replyAll = () => {
    if (!email || !threadData?.userThread) return;
    composeNewDraft();
    dispatch(
      skemailModalReducer.actions.replyAllCompose({
        email,
        thread: threadData.userThread,
        emailAliases,
        defaultEmailAlias,
        signature: userSignature
      })
    );
  };

  /** forward the last email in the thread */
  const forward = () => {
    if (!email || !threadData?.userThread) return;
    composeNewDraft();
    dispatch(
      skemailModalReducer.actions.forwardCompose({
        email,
        emailAliases,
        defaultEmailAlias,
        thread: threadData.userThread
      })
    );
  };

  const activeThreadLabels = (threadData?.userThread?.attributes.userLabels.map(userLabelFromGraphQL) ||
    []) as UserLabelPlain[];

  return {
    reply,
    replyAll,
    forward,
    activeThreadLabels
  };
}
