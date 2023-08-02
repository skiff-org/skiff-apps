import { Icon, IconProps } from '@skiff-org/skiff-ui';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { TabPage, SettingValue, useGetFF, useUserPreference } from 'skiff-front-utils';
import { SystemLabels, ThreadDisplayFormat } from 'skiff-graphql';
import { GmailImportImprovementsFlag, trimAndLowercase, StorageTypes } from 'skiff-utils';

import { useSettings } from '../components/Settings/useSettings';
import { MIN_SPECIFIED_QUERY_LENGTH } from '../components/shared/CmdPalette/constants';
import { skemailModalReducer } from '../redux/reducers/modalReducer';
import { ModalType } from '../redux/reducers/modalTypes';
import { markAllThreadsAsRead } from '../utils/mailboxUtils';
import { SearchAction, SearchItemType } from '../utils/searchWorkerUtils';

import { useDrafts } from './useDrafts';

// The number of actions to show if  query length is less than MIN_SPECIFIED_QUERY_LENGTH
export const UNSPECIFIED_ACTION_CAP = 3;

const createAction = (
  subject: string,
  onClick: () => void,
  iconProps: IconProps,
  cmdTooltip?: string
): SearchAction => ({
  itemType: SearchItemType.Action,
  subject,
  onClick,
  iconProps,
  cmdTooltip
});

export const useQuickActions = (query: string): Array<SearchAction> => {
  const hasGmailImportImprovementsFF = useGetFF<GmailImportImprovementsFlag>('gmailImportImprovements');

  const [filteredActions, setFilteredActions] = useState<Array<SearchAction>>([]);
  const { composeNewDraft } = useDrafts();
  const dispatch = useDispatch();
  const [threadFormat, setThreadFormat] = useUserPreference(StorageTypes.THREAD_FORMAT);
  const { openSettings } = useSettings();
  const openCompose = useCallback(() => dispatch(skemailModalReducer.actions.openEmptyCompose()), [dispatch]);
  const addLabel = useCallback(
    () => dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.CreateOrEditLabelOrFolder })),
    [dispatch]
  );
  const addFolder = useCallback(
    () =>
      dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.CreateOrEditLabelOrFolder, folder: true })),
    [dispatch]
  );
  const toggleThreadFormat = useCallback(
    () => {
      // Act like a toggle; if threadFormat is full, set it to right, and vice versa
      setThreadFormat(threadFormat === ThreadDisplayFormat.Full ? ThreadDisplayFormat.Right : ThreadDisplayFormat.Full);
    }, [threadFormat, setThreadFormat]
  );
  const markAllReadClick = async () => {
    await markAllThreadsAsRead(true, SystemLabels.Inbox, hasGmailImportImprovementsFF);
  };
  const importMail = useCallback(
    () => openSettings({ tab: TabPage.Import, setting: SettingValue.ImportMail }),
    [openSettings]
  );
  const openShortcuts = useCallback(
    () => dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.Shortcuts })),
    [dispatch]
  );

  const markInboxReadAction = createAction(
    'Mark inbox as read',
    () => void markAllReadClick(),
    { icon: Icon.EnvelopeRead },
    undefined // no shortcut
  );

  // Cache so that we don't have infinite re-render on useSearch deps array
  const actions = React.useMemo(() => {
    const composeAction = createAction(
      'Compose message',
      () => {
        void openCompose();
        composeNewDraft();
      },
      { icon: Icon.Compose },
      'C'
    );
    const addLabelAction = createAction(
      'Create label',
      () => void addLabel(),
      { icon: Icon.Tag },
      undefined // no shortcut
    );
    const addFolderAction = createAction(
      'Create folder',
      () => void addFolder(),
      { icon: Icon.Folder },
      undefined // no shortcut
    );
    const toggleThreadFormatAction = createAction(
      `Switch to ${threadFormat === ThreadDisplayFormat.Full ? 'split' : 'full'} view`,
      () => void toggleThreadFormat(),
      { icon: threadFormat === ThreadDisplayFormat.Full ? Icon.FullView : Icon.SplitView },
      'T'
    );
    const importMailAction = createAction(
      'Import mail',
      () => void importMail(),
      { icon: Icon.MoveMailbox },
      undefined // no shortcut
    );
    const openShortcutsAction = createAction(
      'Help with shortcuts',
      () => void openShortcuts(),
      { icon: Icon.QuestionCircle },
      '?'
    );
    return [composeAction, addLabelAction, addFolderAction, toggleThreadFormatAction, markInboxReadAction, importMailAction, openShortcutsAction];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCompose, addLabel, importMail, addFolder, openShortcuts]);

  useEffect(() => {
    const actionsMatchingQuery = query.length
      ? actions.filter((action) => trimAndLowercase(action.subject).includes(trimAndLowercase(query)))
      : actions;
    setFilteredActions(
      query.length >= MIN_SPECIFIED_QUERY_LENGTH || query.length === 0
        ? actionsMatchingQuery
        : actionsMatchingQuery.slice(0, UNSPECIFIED_ACTION_CAP)
    );
  }, [query, actions]);

  return filteredActions;
};
