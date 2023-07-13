import { Editor } from '@tiptap/react';
import { InputField } from '@skiff-org/skiff-ui';
import React, { useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { generateSymmetricKey, stringDecryptAsymmetric, stringEncryptAsymmetric } from '@skiff-org/skiff-crypto';
import { decryptDatagramV2 } from '@skiff-org/skiff-crypto';
import {
  useGetAutoReplyQuery,
  useDeleteAutoReplyMutation,
  useSetAutoReplyMutation,
  GetAutoReplyDocument,
  useDecryptionServicePublicKeyQuery,
  encryptMessageContent,
  MailSubjectDatagram,
  MailHtmlDatagram
} from 'skiff-front-graphql';
import { TitleActionSection, ConfirmModal, useToast, requireCurrentUserData } from 'skiff-front-utils';
import { getTierNameFromSubscriptionPlan, SetAutoReplyRequest } from 'skiff-graphql';
import { getAutoreplyEnabled, PaywallErrorCode } from 'skiff-utils';
import styled from 'styled-components';

import { usePaywall } from '../../../hooks/usePaywall';
import { useSubscriptionPlan } from '../../../utils/userUtils';
import { convertHtmlToTextContent } from '../../MailEditor/mailEditorUtils';
import { SettingTextArea } from '../SettingTextArea';

const InputFieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

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
  const {
    data: { activeSubscription }
  } = useSubscriptionPlan();

  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<Editor>(null);
  const openPaywallModal = usePaywall();

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
      enqueueToast({ title: 'Auto-reply deleted' });
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
      const messageHtmlBody = newAutoReply ?? currentAutoReply ?? '';
      const messageTextBody = convertHtmlToTextContent(newAutoReply ?? currentAutoReply ?? '');

      const { encryptedSubject, encryptedText, encryptedHtml, encryptedTextAsHtml, encryptedTextSnippet } =
        encryptMessageContent(subject, messageTextBody, messageHtmlBody, [], decryptedSessionKey);

      const request: SetAutoReplyRequest = {
        encryptedSubject,
        encryptedText,
        encryptedHtml,
        encryptedTextAsHtml,
        encryptedTextSnippet,
        encryptedUserSessionKey: {
          encryptedBy: publicKey,
          encryptedSessionKey: encryptedUserSessionKey
        },
        encryptedSkiffSessionKey: {
          encryptedBy: publicKey,
          encryptedSessionKey: ecryptedSkiffSessionKey
        }
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
    void onDelete();
    setIsConfirmOpen(false);
  };

  const tierName = getTierNameFromSubscriptionPlan(activeSubscription);
  const autoreplyEnabled = getAutoreplyEnabled(tierName);
  const checkPaywallAndEdit = () => {
    if (!autoreplyEnabled) {
      openPaywallModal(PaywallErrorCode.AutoReply);
      return;
    }
    setIsEditing(true);
  };

  const editClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    checkPaywallAndEdit();
  };

  useEffect(() => {
    // focus when the input field renders
    if (subjectInputRef.current) {
      subjectInputRef.current?.focus();
    }
  }, [subjectInputRef.current]);

  // decrypt current auto-reply message
  useEffect(() => {
    const sessionKey = autoReplyData?.autoReply?.encryptedSessionKey;
    const encryptedSubject = autoReplyData?.autoReply?.encryptedSubject.encryptedData ?? '';
    const encryptedHtml = autoReplyData?.autoReply?.encryptedHtml.encryptedData;
    if (!!sessionKey && !!encryptedSubject && !!encryptedHtml) {
      // auto-reply was updated
      const decryptedSessionKey = stringDecryptAsymmetric(
        privateKey || '',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        sessionKey.encryptedBy,
        sessionKey.encryptedSessionKey
      );
      const decryptedSubject = decryptDatagramV2(MailSubjectDatagram, decryptedSessionKey, encryptedSubject).body
        .subject;
      setCurrentSubject(decryptedSubject);
      const decryptedHtml = decryptDatagramV2(MailHtmlDatagram, decryptedSessionKey, encryptedHtml).body.html;
      setCurrentAutoReply(decryptedHtml);
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
        subtitle='Add an automated reply to incoming messages'
        title={isMobile ? '' : 'Auto reply'}
      />
      {(!!currentAutoReply || isEditing || isMobile) && (
        <InputFieldContainer>
          <InputField
            error={!!errorMsg}
            innerRef={subjectInputRef}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSubject(e.target.value)}
            onFocus={() => checkPaywallAndEdit()}
            onKeyPress={(e) => {
              // pressing enter focuses the next field
              if (e.key === 'Enter') {
                bodyInputRef.current?.commands.focus();
              }
            }}
            placeholder='Subject'
            value={newSubject ?? currentSubject}
          />
          <SettingTextArea
            errorMsg={errorMsg}
            innerRef={bodyInputRef}
            isEditing={isEditing || isMobile}
            onDelete={() => setIsConfirmOpen(true)}
            onFocus={() => {
              checkPaywallAndEdit();
              setErrorMsg(undefined);
            }}
            onSave={() => void onSave()}
            placeholder='Add auto-reply message here'
            setValue={setNewAutoReply}
            value={newAutoReply ?? currentAutoReply}
          />
        </InputFieldContainer>
      )}
      <ConfirmModal
        confirmName='Delete'
        description='Are you sure you want to delete this auto-reply message?'
        destructive
        onClose={onCloseConfirm}
        onConfirm={onConfirm}
        open={isConfirmOpen}
        title='Delete'
      />
    </>
  );
};
