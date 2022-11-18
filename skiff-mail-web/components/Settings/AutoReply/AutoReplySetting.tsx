import { ButtonGroupItem, Dialog, Icon, InputField } from 'nightwatch-ui';
import React, { useEffect, useRef, useState } from 'react';
import { generateSymmetricKey, stringDecryptAsymmetric, stringEncryptAsymmetric } from 'skiff-crypto';
import { decryptDatagram } from 'skiff-crypto-v2';
import { TitleActionSection, useToast } from 'skiff-front-utils';
import { SetAutoReplyRequest } from 'skiff-graphql';
import {
  useGetAutoReplyQuery,
  useDeleteAutoReplyMutation,
  useSetAutoReplyMutation,
  GetAutoReplyDocument,
  useDecryptionServicePublicKeyQuery,
  encryptMessageContent,
  MailSubjectDatagram,
  MailTextDatagram
} from 'skiff-mail-graphql';

import { requireCurrentUserData } from '../../../apollo/currentUser';
import { useDefaultEmailAlias } from '../../../hooks/useDefaultEmailAlias';
import { convertHtmlToTextContent } from '../../MailEditor/mailEditorUtils';
import { SettingTextArea } from '../SettingTextArea';

export const AutoReplySetting = () => {
  const [newSubject, setNewSubject] = useState<string | undefined>(undefined);
  const [currentSubject, setCurrentSubject] = useState<string | undefined>(undefined);
  const [newAutoReply, setNewAutoReply] = useState<string | undefined>(undefined);
  const [currentAutoReply, setCurrentAutoReply] = useState<string | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);

  const { data: autoReplyData } = useGetAutoReplyQuery();
  const { enqueueToast } = useToast();

  const currentUser = requireCurrentUserData();
  const privateKey = currentUser.privateUserData.privateKey;
  const publicKey = currentUser.publicKey;
  const externalPublicKey = useDecryptionServicePublicKeyQuery().data?.decryptionServicePublicKey;

  const [setAutoReply] = useSetAutoReplyMutation();
  const [deleteAutoReply] = useDeleteAutoReplyMutation();
  const [defaultEmailAlias] = useDefaultEmailAlias();

  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLInputElement>(null);

  // reset to initial values
  const reset = () => {
    setNewSubject(undefined);
    setNewAutoReply(undefined);
    setIsEditing(false);
  };

  // close confirm modal
  const onCloseConfirm = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsConfirmOpen(false);
  };

  // cancel editing
  const onCancel = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    reset();
    setErrorMsg(undefined);
  };

  // delete auto-reply message
  const onDelete = async () => {
    try {
      if (!!currentAutoReply) {
        await deleteAutoReply({ refetchQueries: [{ query: GetAutoReplyDocument }] });
      }
      reset();
      enqueueToast({
        body: 'Auto-reply message deleted',
        icon: Icon.Trash
      });
    } catch (e) {
      setErrorMsg('Failed to delete auto-reply message');
    }
  };

  // save new auto-reply message
  const onSave = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    // do not save if the message was not updated
    const subjectUpdated = newSubject !== undefined && newSubject !== currentSubject;
    const bodyUpdated = newAutoReply !== undefined && newAutoReply !== currentAutoReply;
    if (!subjectUpdated && !bodyUpdated) {
      onCancel();
      return;
    }
    // delete current message if the user saves an empty body field
    if (bodyUpdated && !newAutoReply.length) {
      setIsConfirmOpen(true);
      return;
    }
    // encrypt and save new message
    try {
      const decryptedSessionKey = generateSymmetricKey();
      const encryptedUserSessionKey = stringEncryptAsymmetric(privateKey || '', publicKey, decryptedSessionKey);
      const ecryptedSkiffSessionKey = stringEncryptAsymmetric(
        privateKey || '',
        externalPublicKey || { key: '' },
        decryptedSessionKey
      );

      const subject = subjectUpdated ? newSubject : currentSubject ?? '';
      const messageHtmlBody = document.createElement('span');
      messageHtmlBody.appendChild(document.createTextNode(newAutoReply ?? currentAutoReply ?? ''));
      const messageTextBody = convertHtmlToTextContent(messageHtmlBody.innerHTML);

      const { encryptedSubject, encryptedText, encryptedHtml, encryptedTextAsHtml } = encryptMessageContent(
        subject,
        messageTextBody,
        messageHtmlBody.innerHTML,
        [],
        decryptedSessionKey
      );

      const request: SetAutoReplyRequest = {
        encryptedSubject,
        encryptedText,
        encryptedHtml,
        encryptedTextAsHtml,
        encryptedUserSessionKey: {
          encryptedBy: publicKey,
          encryptedSessionKey: encryptedUserSessionKey
        },
        encryptedSkiffSessionKey: {
          encryptedBy: publicKey,
          encryptedSessionKey: ecryptedSkiffSessionKey
        },
        from: defaultEmailAlias ?? ''
      };

      await setAutoReply({
        variables: { request },
        refetchQueries: [{ query: GetAutoReplyDocument }]
      });

      reset();
    } catch {
      setErrorMsg(`Failed to ${!!currentAutoReply ? 'update' : 'add'} auto-reply message`);
    }
  };

  // confirm auto-reply deletion
  const onConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setIsConfirmOpen(false);
  };

  const editClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    subjectInputRef.current?.focus();
  };
  // decrypt current auto-reply message
  useEffect(() => {
    const sessionKey = autoReplyData?.autoReply?.encryptedSessionKey;
    const encryptedSubject = autoReplyData?.autoReply?.encryptedSubject.encryptedData ?? '';
    const encryptedText = autoReplyData?.autoReply?.encryptedText.encryptedData;
    if (!!sessionKey && !!encryptedSubject && !!encryptedText) {
      // auto-reply was updated
      const decryptedSessionKey = stringDecryptAsymmetric(
        privateKey || '',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        sessionKey.encryptedBy,
        sessionKey.encryptedSessionKey
      );
      const decryptedSubject = decryptDatagram(MailSubjectDatagram, decryptedSessionKey, encryptedSubject).body.subject;
      setCurrentSubject(decryptedSubject);
      const decryptedText = decryptDatagram(MailTextDatagram, decryptedSessionKey, encryptedText).body.text;
      setCurrentAutoReply(decryptedText);
    } else {
      // auto-reply was deleted
      setCurrentSubject(undefined);
      setCurrentAutoReply(undefined);
    }
  }, [autoReplyData, privateKey]);

  return (
    <>
      <TitleActionSection
        actions={[
          {
            onClick: isEditing ? onCancel : editClick,
            label: isEditing ? 'Cancel' : !!currentAutoReply ? 'Edit' : 'Add',
            type: 'button'
          }
        ]}
        subtitle='Add an automated reply to incoming messages.'
        title='Auto reply'
      />
      {(!!currentAutoReply || isEditing) && (
        <>
          <InputField
            error={!!errorMsg}
            innerRef={subjectInputRef}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSubject(e.target.value)}
            onFocus={() => setIsEditing(true)}
            onKeyPress={(e) => {
              // pressing enter focuses the next field
              if (e.key === 'Enter') bodyInputRef.current?.focus();
            }}
            placeholder='Subject'
            style={{ borderRadius: '8px' }}
            value={newSubject ?? currentSubject}
          />
          <SettingTextArea
            errorMsg={errorMsg}
            innerRef={bodyInputRef}
            isEditing={isEditing}
            onDelete={() => setIsConfirmOpen(true)}
            onFocus={() => {
              setIsEditing(true);
              setErrorMsg(undefined);
            }}
            onSave={onSave}
            placeholder='Add auto-reply message here'
            setValue={setNewAutoReply}
            value={newAutoReply ?? currentAutoReply}
          />
        </>
      )}
      <Dialog
        description='Are you sure you want to delete this auto-reply message?'
        onClose={onCloseConfirm}
        open={isConfirmOpen}
        title='Delete'
      >
        <ButtonGroupItem key='delete' label='Delete' onClick={onConfirm} />
        <ButtonGroupItem key='cancel' label='Cancel' onClick={onCloseConfirm} />
      </Dialog>
    </>
  );
};
