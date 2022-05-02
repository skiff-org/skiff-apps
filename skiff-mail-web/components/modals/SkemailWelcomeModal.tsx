import { useRouter } from 'next/router';
import { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';

import { ButtonGroupItem, Dialog, DialogTypes, InputField, Typography } from '../../../skiff-ui/src';
import { useRequiredCurrentUserData } from '../../apollo/currentUser';
import {
  GetCurrentUserEmailAliasesDocument,
  GetCurrentUserEmailAliasesQuery,
  useCreateEmailAliasMutation,
  useSetUserPublicKeyMutation
} from '../../generated/graphql';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import Illustration, { Illustrations } from '../../svgs/Illustration';
import { getEditorBasePath } from '../../utils/linkToEditorUtils';

export const SkemailWelcomeModal: React.FC = () => {
  const [alias, setAlias] = useState('');
  const [error, setError] = useState<string | undefined>();
  const router = useRouter();

  const userData = useRequiredCurrentUserData();
  const { openModal: openSharedModal } = useAppSelector((state) => state.modal);
  const dispatch = useDispatch();

  const [setUserPublicKey] = useSetUserPublicKeyMutation({
    variables: {
      request: {
        publicKey: {
          key: userData.publicKey.key,
          signature: userData.publicKey.signature
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
      cache.updateQuery<GetCurrentUserEmailAliasesQuery>(
        { query: GetCurrentUserEmailAliasesDocument },
        (existingCache) => {
          const emailAliases = response.data?.createEmailAlias?.emailAliases;
          if (!existingCache || !existingCache.currentUser) {
            return {
              currentUser: {
                userID: userData.userID,
                emailAliases
              }
            };
          }
          const { currentUser } = existingCache;
          return {
            ...existingCache,
            currentUser: {
              ...currentUser,
              emailAliases
            }
          };
        }
      );
    }
  });
  const setKeysAndAlias = async () => {
    if (error) return;
    try {
      await setUserPublicKey();
    } catch (e: any) {
      console.error(e);
    }
    try {
      await createEmailAliasMutation();

      // Close modal
      dispatch(skemailModalReducer.actions.setOpenModal(undefined));
    } catch (e: any) {
      setError('Failed to create email alias');
      console.error(e);
    }
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

  const renderInputField = () => (
    <InputField
      endAdornment={<Typography type='paragraph'>@skiff.com</Typography>}
      errorMsg={error}
      helperText={error || 'You can use letters, numbers, and periods.'}
      onChange={onInputChange}
      onKeyPress={submitOnEnter}
      placeholder='Username'
      value={alias}
    />
  );

  return (
    <Dialog
      description='Create your email address'
      icon={<Illustration illustration={Illustrations.EmptyMailbox} isMobile={isMobile} />}
      inputField={renderInputField()}
      onClose={() => {
        void router.push(getEditorBasePath());
      }}
      open={openSharedModal?.type === ModalType.SkemailWelcome}
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
  );
};
