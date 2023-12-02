import { Icon } from 'nightwatch-ui';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue } from 'skiff-front-utils';
import { DEFAULT_WORKSPACE_EVENT_VERSION, useUserPreference } from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';
import { insertIf, StorageTypes } from 'skiff-utils';

import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { storeWorkspaceEvent } from '../../../utils/userUtils';

import { AutoReplySetting } from './AutoReplySetting';
import SecuredBySkiffSignatureSetting from './SecuredBySkiffSignatureSetting';
import { SignatureManagerSetting } from './SignatureManagerSetting';

export const autoReplySettings: Setting[] = [
  {
    type: SettingType.Custom,
    value: SettingValue.AutoReply,
    component: <AutoReplySetting key='auto-reply' />,
    label: SETTINGS_LABELS[SettingValue.AutoReply],
    icon: Icon.Reply,
    color: 'blue'
  }
];

export const useResponseSettings: () => Setting[] = () => {
  const [securedBySkiffSigDisabled, setSecuredBySkiffSigDisabled] = useUserPreference(
    StorageTypes.SECURED_BY_SKIFF_SIG_DISABLED
  );

  const dispatch = useDispatch();

  const updateSecuredBySkiffSigPreference = () => {
    if (securedBySkiffSigDisabled) {
      setSecuredBySkiffSigDisabled(false);
      void storeWorkspaceEvent(WorkspaceEventType.EnableDefaultSignature, '', DEFAULT_WORKSPACE_EVENT_VERSION);
    } else {
      dispatch(
        skemailModalReducer.actions.setOpenModal({
          type: ModalType.ConfirmSignature,
          onConfirm: () => setSecuredBySkiffSigDisabled(true)
        })
      );
      void storeWorkspaceEvent(WorkspaceEventType.DisableDefaultSignature, '', DEFAULT_WORKSPACE_EVENT_VERSION);
    }
  };

  const settings: Setting[] = [
    ...autoReplySettings,
    {
      type: SettingType.Custom,
      value: SettingValue.SignatureManager,
      component: <SignatureManagerSetting key='signature-manager' />,
      label: SETTINGS_LABELS[SettingValue.SignatureManager],
      icon: Icon.Edit,
      color: 'red'
    },
    ...insertIf<Setting>(!isMobile, {
      type: SettingType.Custom,
      value: SettingValue.SecuredBySkiffSignature,
      label: SETTINGS_LABELS[SettingValue.SecuredBySkiffSignature],
      icon: Icon.ShieldCheck,
      color: 'green',
      component: (
        <SecuredBySkiffSignatureSetting
          securedBySkiffSigDisabled={securedBySkiffSigDisabled}
          updateSecuredBySkiffSigPreference={updateSecuredBySkiffSigPreference}
        />
      )
    }),
    ...insertIf<Setting>(isMobile, {
      type: SettingType.Toggle,
      value: SettingValue.SecuredBySkiffSignature,
      label: SETTINGS_LABELS[SettingValue.SecuredBySkiffSignature],
      icon: Icon.ShieldCheck,
      color: 'green',
      checked: !securedBySkiffSigDisabled,
      onChange: () => updateSecuredBySkiffSigPreference(),
      loading: false
    })
  ];

  return settings;
};
