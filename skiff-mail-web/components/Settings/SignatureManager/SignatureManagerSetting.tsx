import { ButtonGroupItem, Dialog, Icon } from 'nightwatch-ui';
import React, { useEffect, useState, useRef } from 'react';
import {
  generateSymmetricKey,
  encryptSymmetric,
  stringEncryptAsymmetric,
  stringDecryptAsymmetric,
  decryptSymmetric
} from 'skiff-crypto';
import { useToast, TitleActionSection } from 'skiff-front-utils';
import {
  useGetUserSignatureQuery,
  GetUserSignatureDocument,
  useDeleteUserSignatureMutation,
  useSetUserSignatureMutation,
  UserSignatureDatagram
} from 'skiff-mail-graphql';

import { requireCurrentUserData } from '../../../apollo/currentUser';
import { SettingTextArea } from '../SettingTextArea';

export const SignatureManagerSetting = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentSignature, setCurrentSignature] = useState<string | undefined>(undefined);
  const [newSignature, setNewSignature] = useState<string | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);

  const { data: userSignatureData } = useGetUserSignatureQuery();
  const { enqueueToast } = useToast();

  const currentUser = requireCurrentUserData();
  const privateKey = currentUser.privateUserData ? currentUser.privateUserData.privateKey : '';
  const publicKey = currentUser.publicKey;

  const [setUserSignature] = useSetUserSignatureMutation();
  const [deleteUserSignature] = useDeleteUserSignatureMutation();

  const inputRef = useRef<HTMLInputElement>(null);

  // reset to initial values
  const reset = () => {
    setNewSignature(undefined);
    setIsEditing(false);
  };

  // cancel editing
  const onCancel = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    reset();
    setErrorMsg(undefined);
  };

  // delete user signature
  const onDelete = async () => {
    try {
      await deleteUserSignature({ refetchQueries: [{ query: GetUserSignatureDocument }] });
      reset();
      enqueueToast({
        body: 'Signature deleted',
        icon: Icon.Trash
      });
    } catch {
      setErrorMsg('Failed to delete signature');
    }
  };

  // save new user signature
  const onSave = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    // do not save if no signature was added
    // or if the new signature is the same as the current signature
    if (newSignature === undefined || currentSignature === newSignature) {
      onCancel(e);
      return;
    }
    // delete current signature if the user saves an empty text area
    if (!newSignature.length) {
      setIsConfirmOpen(true);
      return;
    }
    // encrypt and save new signature
    try {
      const decryptedKey = generateSymmetricKey();
      const encryptedSignature = encryptSymmetric(newSignature, decryptedKey, UserSignatureDatagram);
      const encryptedKey = stringEncryptAsymmetric(privateKey || '', publicKey, decryptedKey);
      await setUserSignature({
        variables: {
          request: {
            sessionKey: {
              encryptedBy: publicKey,
              encryptedSessionKey: encryptedKey
            },
            userSignature: {
              encryptedData: encryptedSignature
            }
          }
        },
        refetchQueries: [{ query: GetUserSignatureDocument }]
      });
      reset();
    } catch {
      setErrorMsg(`Failed to ${!!currentSignature ? 'update' : 'add'} signature`);
    }
  };

  // confirm signature deletion
  const onConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setIsConfirmOpen(false);
    if (isDropdownOpen) setIsDropdownOpen(false);
    else if (isEditing) setIsEditing(false);
  };

  const editClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    inputRef.current?.focus();
  };

  // decrypt current signature
  useEffect(() => {
    const sessionKey = userSignatureData?.userSignature?.sessionKey;
    const userSignature = userSignatureData?.userSignature?.userSignature;
    if (!!sessionKey && !!userSignature) {
      // signature was updated
      const decryptedSessionKey = stringDecryptAsymmetric(
        privateKey || '',
        sessionKey.encryptedBy,
        sessionKey.encryptedSessionKey
      );
      const decryptedSignature = decryptSymmetric(
        userSignature?.encryptedData,
        decryptedSessionKey,
        UserSignatureDatagram
      );
      setCurrentSignature(decryptedSignature);
    } else {
      // signature was deleted
      setCurrentSignature(undefined);
    }
  }, [userSignatureData, privateKey]);

  return (
    <>
      <TitleActionSection
        actions={[
          {
            onClick: isEditing ? onCancel : editClick,
            label: isEditing ? 'Cancel' : !!currentSignature ? 'Edit' : 'Add signature',
            type: 'button'
          }
        ]}
        subtitle='Add a signature to be appended at the end of your outgoing emails.'
        title='Email signature'
      />
      {(!!currentSignature || isEditing) && (
        <SettingTextArea
          errorMsg={errorMsg}
          innerRef={inputRef}
          isEditing={isEditing}
          onDelete={() => setIsConfirmOpen(true)}
          onFocus={() => {
            setIsEditing(true);
            setErrorMsg(undefined);
          }}
          onSave={onSave}
          placeholder='Add signature here'
          setValue={setNewSignature}
          value={newSignature ?? currentSignature}
        />
      )}
      <Dialog
        description='Are you sure you want to delete this signature?'
        onClose={(e?: React.MouseEvent) => {
          e?.stopPropagation();
          setIsConfirmOpen(false);
        }}
        open={isConfirmOpen}
        title='Delete'
      >
        <ButtonGroupItem key='delete' label='Delete' onClick={onConfirm} />
        <ButtonGroupItem
          key='cancel'
          label='Cancel'
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setIsConfirmOpen(false);
          }}
        />
      </Dialog>
    </>
  );
};
