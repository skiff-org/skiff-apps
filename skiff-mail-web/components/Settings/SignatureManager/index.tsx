import { Icon } from '@skiff-org/skiff-ui';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  DEFAULT_WORKSPACE_EVENT_VERSION,
  Setting,
  SETTINGS_LABELS,
  SettingType,
  SettingValue,
  useUserPreference
} from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';
import { insertIf, StorageTypes } from 'skiff-utils';

import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { storeWorkspaceEvent } from '../../../utils/userUtils';

import SecuredBySkiffSignatureSetting from './SecuredBySkiffSignatureSetting';
import { SignatureManagerSetting } from './SignatureManagerSetting';

export const useSignatureSettings: () => Setting[] = () => {
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
