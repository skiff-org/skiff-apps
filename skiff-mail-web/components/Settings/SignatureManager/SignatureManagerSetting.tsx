import { Editor } from '@tiptap/react';
import React, { useEffect, useState, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import {
  generateSymmetricKey,
  encryptSymmetric,
  stringEncryptAsymmetric,
  stringDecryptAsymmetric,
  decryptSymmetric
} from 'skiff-crypto';
import {
  useGetUserSignatureQuery,
  GetUserSignatureDocument,
  useDeleteUserSignatureMutation,
  useSetUserSignatureMutation,
  UserSignatureDatagram
} from 'skiff-front-graphql';
import { useToast, ConfirmModal, TitleActionSection, requireCurrentUserData } from 'skiff-front-utils';
import { MAX_SIGNATURE_SIZE_KB } from 'skiff-utils';

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

  const mailEditorRef = useRef<Editor>(null);

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
      enqueueToast({ title: 'Signature deleted' });
    } catch {
      setErrorMsg('Failed to delete signature');
    }
  };

  // save new user signature
  const onSave = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    mailEditorRef.current?.commands.blur();
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
    } catch (err: any) {
      setErrorMsg(`Failed to ${!!currentSignature ? 'update' : 'add'} signature`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!err.message || typeof err.message !== 'string') {
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const msg = err.message;
      const body =
        typeof msg === 'string' && msg.includes('too large')
          ? `Signature must be under ${MAX_SIGNATURE_SIZE_KB} kb`
          : undefined;
      enqueueToast({
        title: `Failed to ${!!currentSignature ? 'update' : 'add'} signature`,
        body
      });
    }
  };

  // confirm signature deletion
  const onConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    void onDelete();
    setIsConfirmOpen(false);
    if (isDropdownOpen) setIsDropdownOpen(false);
    else if (isEditing) setIsEditing(false);
  };

  const editClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    mailEditorRef.current?.commands.focus();
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
        subtitle='Add a signature to be appended at the end of your outgoing emails'
        title={isMobile ? '' : 'Email signature'}
      />
      {(!!currentSignature || isEditing || isMobile) && (
        <SettingTextArea
          errorMsg={errorMsg}
          innerRef={mailEditorRef}
          isEditing={isEditing}
          onDelete={() => setIsConfirmOpen(true)}
          onFocus={() => {
            setIsEditing(true);
            setErrorMsg(undefined);
          }}
          onSave={() => void onSave()}
          placeholder='Add signature here'
          setValue={setNewSignature}
          value={newSignature ?? currentSignature}
        />
      )}
      <ConfirmModal
        confirmName='Delete'
        description='Are you sure you want to delete this signature?'
        destructive
        onClose={(e?: React.MouseEvent) => {
          e?.stopPropagation();
          setIsConfirmOpen(false);
        }}
        onConfirm={onConfirm}
        open={isConfirmOpen}
        title='Delete'
      />
    </>
  );
};
