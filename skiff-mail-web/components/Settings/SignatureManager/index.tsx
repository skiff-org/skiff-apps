import { Icon } from 'nightwatch-ui';
import { useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue } from 'skiff-front-utils';
import { getTierNameFromSubscriptionPlan } from 'skiff-graphql';
import { canOptOutSecuredBySkiffMail, PaywallErrorCode } from 'skiff-utils';

import { useRequiredCurrentUserData } from '../../../apollo/currentUser';
import useLocalSetting from '../../../hooks/useLocalSetting';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { getSubscriptionPlan } from '../../../utils/userUtils';

import { SignatureManagerSetting } from './SignatureManagerSetting';

export const useSignatureSettings: () => Setting[] = () => {
  const { userID } = useRequiredCurrentUserData();

  const [securedBySkiffSigDisabled, setSecuredBySkiffSigDisabled] = useLocalSetting('securedBySkiffSigDisabled');
  const dispatch = useDispatch();

  const updateSecuredBySkiffSigPreference = useCallback(async () => {
    if (securedBySkiffSigDisabled) {
      // local storage key is removed when 'Secured by Skiff Mail' enabled to discourage tampering by free-tier users
      // this is a cursory protection, given default signature can be manually deleted by those who care
      setSecuredBySkiffSigDisabled(undefined);
    } else {
      const {
        data: { activeSubscription }
      } = await getSubscriptionPlan(userID);
      const tierName = getTierNameFromSubscriptionPlan(activeSubscription);
      const userCanOptOut = canOptOutSecuredBySkiffMail(tierName);
      if (userCanOptOut) {
        setSecuredBySkiffSigDisabled(true);
      } else {
        dispatch(
          skemailModalReducer.actions.setOpenModal({
            type: ModalType.Paywall,
            paywallErrorCode: PaywallErrorCode.SecuredBySkiffSig
          })
        );
      }
    }
  }, [userID, setSecuredBySkiffSigDisabled, dispatch, securedBySkiffSigDisabled]);

  const settings = useMemo<Setting[]>(
    () => [
      {
        type: SettingType.Custom,
        value: SettingValue.SignatureManager,
        component: <SignatureManagerSetting key='signature-manager' />,
        label: SETTINGS_LABELS[SettingValue.SignatureManager],
        icon: Icon.Edit,
        color: 'red'
      },
      {
        type: SettingType.Toggle,
        value: SettingValue.SecuredBySkiffSignature,
        label: SETTINGS_LABELS[SettingValue.SecuredBySkiffSignature],
        icon: Icon.ShieldCheck,
        color: 'green',
        onChange: () => void updateSecuredBySkiffSigPreference(),
        checked: !securedBySkiffSigDisabled
      }
    ],
    [securedBySkiffSigDisabled, updateSecuredBySkiffSigPreference]
  );
  return settings;
};
