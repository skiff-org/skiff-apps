import { Icon } from 'nightwatch-ui';
import { useCallback, useMemo, useState } from 'react';
import {
  GetContactAutoSyncSettingsDocument,
  useGetContactAutoSyncSettingsQuery,
  useSetContactAutosyncSettingMutation
} from 'skiff-front-graphql';
import { insertIf } from 'skiff-utils';

import { useToast } from '../../../hooks';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue } from '../Settings.types';

import ContactsImport from './ContactsImport';
import ContactsTable from './ContactsTable';

const useContactsSettings = (): Setting[] => {
  // Custom hooks
  const { enqueueToast } = useToast();

  // State
  const [showProfileView, setShowProfileView] = useState<boolean>(false);

  // Graphql
  const { data, loading, error } = useGetContactAutoSyncSettingsQuery();

  const currentAutoSyncContactsSetting = data?.currentUser?.autoSyncContactsSetting ?? false;

  const [setContactAutoSyncSettings] = useSetContactAutosyncSettingMutation({
    onError: (err) => {
      console.error(err);
      enqueueToast({ title: 'Failed to set auto sync contacts setting' });
    }
  });

  const updateContactAutosyncSetting = useCallback(
    () =>
      setContactAutoSyncSettings({
        variables: {
          request: !currentAutoSyncContactsSetting
        },
        refetchQueries: [{ query: GetContactAutoSyncSettingsDocument }]
      }),
    [setContactAutoSyncSettings, currentAutoSyncContactsSetting]
  );

  const settings = useMemo<Setting[]>(
    () => [
      ...insertIf<Setting>(!showProfileView, {
        type: SettingType.Toggle,
        description: 'Automatically save recipients to contact list',
        label: SETTINGS_LABELS[SettingValue.ContactsAutoSync],
        value: SettingValue.ContactsAutoSync,
        icon: Icon.Reload,
        color: 'dark-blue',
        checked: currentAutoSyncContactsSetting,
        onChange: () => void updateContactAutosyncSetting(),
        loading: loading,
        error: !!error
      }),
      ...insertIf<Setting>(!showProfileView, {
        type: SettingType.Custom,
        label: SETTINGS_LABELS[SettingValue.ContactsImport],
        value: SettingValue.ContactsImport,
        icon: Icon.UserPlus,
        color: 'green',
        component: <ContactsImport />
      }),
      {
        type: SettingType.Custom,
        label: SETTINGS_LABELS[SettingValue.Contacts],
        value: SettingValue.Contacts,
        icon: Icon.UserCircle,
        color: 'blue',
        component: <ContactsTable setShowProfileView={setShowProfileView} showProfileView={showProfileView} />,
        fullHeight: true
      }
    ],
    [currentAutoSyncContactsSetting, showProfileView, loading, error, updateContactAutosyncSetting]
  );
  return settings;
};

export default useContactsSettings;
