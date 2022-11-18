import {} from '@skiff-org/skiff-ui';
import { Button, ButtonGroupItem, Dialog, DialogTypes, Divider, Icon, InputField, Typography } from 'nightwatch-ui';
import { Fragment, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ALIAS_MINIMUM_LENGTH, getStorageKey, StorageTypes, getEditorBasePath } from 'skiff-front-utils';
import { useCreateEmailAliasMutation, useSetUserPublicKeyMutation } from 'skiff-mail-graphql';

import { useRequiredCurrentUserData } from '../../apollo/currentUser';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import Illustration, { Illustrations } from '../../svgs/Illustration';
import { updateEmailAliases } from '../../utils/cache/cache';
import { isWalletEnabled } from '../../utils/metamaskUtils';

import { ConnectWalletModal } from './ConnectWalletModal/ConnectWalletModal';

export const SkemailWelcomeModal: React.FC = () => {
  const [alias, setAlias] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [renderConnectWalletOptions, setRenderConnectWalletOptions] = useState(false);

  const userData = useRequiredCurrentUserData();
  const { openModal: openSharedModal } = useAppSelector((state) => state.modal);
  const dispatch = useDispatch();

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

  const [createEmailAliasMutation] = useCreateEmailAliasMutation({
    variables: {
      request: {
        emailAlias: alias
      }
    },
    update: (cache, response) => {
      const emailAliases = response.data?.createEmailAlias?.emailAliases;
      if (!response.errors && emailAliases) {
        updateEmailAliases(cache, userData.userID, emailAliases);
      }
    }
  });
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
      await createEmailAliasMutation();

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
          <Button align='center' fullWidth onClick={onConnectWalletClick} startIcon={Icon.Wallet} type='secondary'>
            Connect wallet
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', width: '100%' }}>
            <Divider length='short' />
            <span style={{ fontWeight: 560, color: 'var(--text-secondary)' }}>or</span>
            <Divider length='short' />
          </div>
        </>
      )}
      <InputField
        endAdornment={<Typography>@skiff.com</Typography>}
        errorMsg={error}
        helperText={error || 'You can use letters, numbers, and periods.'}
        onChange={onInputChange}
        onKeyPress={submitOnEnter}
        placeholder='Email'
        size='large'
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
          icon={<Illustration illustration={Illustrations.EmptyMailbox} />}
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
            onClick={setKeysAndAlias}
          />
        </Dialog>
      )}
      {renderConnectWalletOptions && (
        <ConnectWalletModal
          closeParentModal={() => dispatch(skemailModalReducer.actions.setOpenModal(undefined))}
          onBack={onConnectWalletModalBack}
          onClose={onConnectWalletModalClose}
          open={renderConnectWalletOptions}
          setUserPublicKey={setUserPublicKey}
          userID={userData.userID}
        />
      )}
    </>
  );
};
