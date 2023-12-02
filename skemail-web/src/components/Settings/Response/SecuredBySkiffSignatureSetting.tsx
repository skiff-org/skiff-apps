import { SETTINGS_LABELS, SettingValue, TitleActionSection } from 'skiff-front-utils';

interface SecuredBySkiffSignatureSettingProps {
  updateSecuredBySkiffSigPreference: () => void;
  securedBySkiffSigDisabled?: boolean;
}

const SecuredBySkiffSignatureSetting = (props: SecuredBySkiffSignatureSettingProps) => {
  const { updateSecuredBySkiffSigPreference, securedBySkiffSigDisabled } = props;

  return (
    <TitleActionSection
      actions={[
        {
          dataTest: 'secured-by-skiff-sig-button',
          onClick: () => updateSecuredBySkiffSigPreference(),
          label: !securedBySkiffSigDisabled ? 'Disable' : 'Enable',
          type: 'button',
          destructive: !securedBySkiffSigDisabled
        }
      ]}
      title={SETTINGS_LABELS[SettingValue.SecuredBySkiffSignature]}
    />
  );
};

export default SecuredBySkiffSignatureSetting;
