import {
  Button,
  ButtonGroupItem,
  Dialog,
  DialogTypes,
  Divider,
  Icon,
  InputField,
  Size,
  Type,
  Typography
} from '@skiff-org/skiff-ui';
import { Fragment, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSetUserPublicKeyMutation } from 'skiff-front-graphql';
import {
  ALIAS_MINIMUM_LENGTH,
  getEditorBasePath,
  getEndAdornment,
  useDefaultEmailAlias,
  useRequiredCurrentUserData,
  useCreateAlias
} from 'skiff-front-utils';
import { StorageTypes, getStorageKey } from 'skiff-utils';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { isWalletEnabled } from '../../utils/metamaskUtils';
import { resolveAndSetENSDisplayName } from '../../utils/userUtils';

import { ConnectWalletModal } from './ConnectWalletModal/ConnectWalletModal';

export const SkemailWelcomeModal: React.FC = () => {
  const [alias, setAlias] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [renderConnectWalletOptions, setRenderConnectWalletOptions] = useState(false);

  const dispatch = useDispatch();
  const userData = useRequiredCurrentUserData();
  const { addEmailAlias } = useCreateAlias();
  const { openModal: openSharedModal } = useAppSelector((state) => state.modal);
  const [, setDefaultEmailAlias] = useDefaultEmailAlias(userData.userID, (newValue: string) => {
    void resolveAndSetENSDisplayName(newValue, userData);
  });

  const [setUserPublicKey] = useSetUserPublicKeyMutation({
    variables: {
      request: {
        publicKey: {
          key: userData.publicKey.key,
          signature: userData.publicKey.signature ? userData.publicKey.signature : ''
        },
        signingPublicKey: { key: userData.signingPublicKey }
      }
    }
  });

  const defaultMailDomain = getEndAdornment(false, userData.username);

  const setKeysAndAlias = async () => {
    if (alias.length <= 5) {
      setError(`Email alias must be greater than ${ALIAS_MINIMUM_LENGTH} characters.`);
      return;
    }
    if (error) return;
    try {
      await setUserPublicKey();
    } catch (err) {
      console.error(err);
    }
    try {
      await addEmailAlias(alias);
      // The initial email alias should be set as the default alias
      setDefaultEmailAlias(`${alias}${defaultMailDomain}`);

      // Close modal
      dispatch(skemailModalReducer.actions.setOpenModal(undefined));
    } catch (err) {
      console.error(err);
      setError((err as any).message);
    }
  };

  const onConnectWalletClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenderConnectWalletOptions(true);
  };

  const submitOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void setKeysAndAlias();
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setAlias(value);
    if (value.length === 0) {
      setError('Please enter an email alias');
    } else if (value.length > 0 && !/^[A-z0-9.]+$/.test(value)) {
      setError('Please enter only letters, numbers, and periods');
    } else {
      setError(undefined);
    }
  };

  const renderInputFields = () => (
    <Fragment>
      {isWalletEnabled() && (
        <>
          <div style={{ width: '100%' }}>
            <Button fullWidth icon={Icon.Wallet} onClick={onConnectWalletClick} type={Type.SECONDARY}>
              Connect wallet
            </Button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', width: '100%' }}>
            <Divider width='40%' />
            <span style={{ fontWeight: 560, color: 'var(--text-secondary)' }}>or</span>
            <Divider width='40%' />
          </div>
        </>
      )}
      <InputField
        endAdornment={<Typography>{defaultMailDomain}</Typography>}
        errorMsg={error}
        helperText='You can use letters, numbers, and periods.'
        onChange={onInputChange}
        onKeyPress={submitOnEnter}
        placeholder='Email'
        size={Size.LARGE}
        value={alias}
      />
    </Fragment>
  );

  const onConnectWalletModalClose = () => {
    window.location.replace(getEditorBasePath());
    setRenderConnectWalletOptions(false);
    // close modal
    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  };

  const onConnectWalletModalBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenderConnectWalletOptions(false);
  };

  const isWelcomeModalOpen = openSharedModal?.type === ModalType.SkemailWelcome;

  return (
    <>
      {!renderConnectWalletOptions && (
        <Dialog
          description='Create your email address. Add up to 3 aliases later.'
          inputField={renderInputFields()}
          onClose={() => {
            // fixes possible infinite redirect
            localStorage.removeItem(getStorageKey(StorageTypes.ORGANIZATION_EVERYONE_TEAM));
            window.location.replace(getEditorBasePath());
          }}
          open={!renderConnectWalletOptions && isWelcomeModalOpen}
          title='Welcome to Skiff Mail'
          type={DialogTypes.Promotional}
        >
          <ButtonGroupItem
            disabled={!!error || !alias}
            key='skemail-welcome-confirm'
            label='Create account'
            onClick={() => void setKeysAndAlias()}
          />
        </Dialog>
      )}
      {renderConnectWalletOptions && (
        <ConnectWalletModal
          closeParentModal={() => dispatch(skemailModalReducer.actions.setOpenModal(undefined))}
          onBack={onConnectWalletModalBack}
          onClose={onConnectWalletModalClose}
          open={renderConnectWalletOptions}
          setUserPublicKey={() => void setUserPublicKey()}
          userID={userData.userID}
        />
      )}
    </>
  );
};

export default SkemailWelcomeModal;
