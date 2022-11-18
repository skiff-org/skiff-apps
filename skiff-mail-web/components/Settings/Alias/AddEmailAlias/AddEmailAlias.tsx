import { ApolloError } from '@apollo/client';
import { Avatar, Button, Typography } from 'nightwatch-ui';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { NewEmailAliasInput, TitleActionSection, useTheme, ConfirmModal } from 'skiff-front-utils';
import { useCreateEmailAliasMutation } from 'skiff-mail-graphql';
import { isPaywallErrorCode, PaywallErrorCode } from 'skiff-utils';
import styled from 'styled-components';

import { skemailModalReducer } from '../../../../redux/reducers/modalReducer';
import { ModalType } from '../../../../redux/reducers/modalTypes';
import { updateEmailAliases } from '../../../../utils/cache/cache';
import AliasOptions from '../AliasOptions/AliasOptions';

const EmailAliasesContainer = styled.div`
  display: flex;
  width: 100%;
  gap: 16px;
  flex-direction: column;
  margin-top: 12px;
`;

const EmailAliasRow = styled.div`
  display: flex;
  height: 20%;
  width: 100%;
  justify-content: space-between;
`;

const EmailAliasUsername = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AddAliasContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
`;

interface AddEmailAliasProps {
  emailAliases: string[];
  userID: string;
  hcaptchaElement: JSX.Element;
  requestHcaptchaToken: () => Promise<string>;
}

/**
 * Component for rendering the interface to add email aliases.
 */
export const AddEmailAlias = ({ emailAliases, userID, hcaptchaElement, requestHcaptchaToken }: AddEmailAliasProps) => {
  const [isAddingAlias, setIsAddingAlias] = useState(false);
  const [newAlias, setNewAlias] = useState('');
  const [preSubmitError, setPreSubmitError] = useState('');
  const [postSubmitError, setPostSubmitError] = useState('');
  const [didSubmit, setDidSubmit] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const [createEmailAlias, { loading }] = useCreateEmailAliasMutation();

  const { theme } = useTheme();
  const dispatch = useDispatch();

  const clearErrors = () => {
    setPreSubmitError('');
    setPostSubmitError('');
  };

  const cancel = () => {
    setIsAddingAlias(false);
    setNewAlias('');
    clearErrors();
  };

  const startAddAlias = () => {
    setIsAddingAlias(true);
  };

  const addAlias = async () => {
    setShowConfirmModal(false);

    try {
      await createEmailAlias({
        variables: {
          request: {
            emailAlias: newAlias
          }
        },
        update: (cache, response) => {
          const updatedEmailAliases = response.data?.createEmailAlias?.emailAliases;
          if (!response.errors && updatedEmailAliases) {
            updateEmailAliases(cache, userID, updatedEmailAliases);
          }
        }
      });
      setNewAlias('');
      setIsAddingAlias(false);
      // Clear any previous errors
      clearErrors();
      setDidSubmit(false);
    } catch (e: unknown) {
      // Typescript won't allow us to annotate `e` as ApolloError above, so
      // we cast it below
      const code = (e as ApolloError)?.graphQLErrors?.[0].extensions.code as PaywallErrorCode;
      if (isPaywallErrorCode(code)) {
        dispatch(
          skemailModalReducer.actions.setOpenModal({
            type: ModalType.Paywall,
            paywallErrorCode: code
          })
        );
      } else {
        setPostSubmitError((e as ApolloError).message);
      }
    }
  };

  const handleAddAliasClick = () => {
    setDidSubmit(true);

    if (preSubmitError || postSubmitError) {
      if (preSubmitError) setPostSubmitError(preSubmitError);
      return;
    }

    setShowConfirmModal(true);
  };

  return (
    <>
      <TitleActionSection
        actions={[
          {
            onClick: isAddingAlias ? cancel : startAddAlias,
            label: isAddingAlias ? 'Cancel' : 'Add alias',
            type: 'button'
          }
        ]}
        subtitle='Create additonal addresses for sending and receiving mail.'
        title='Email aliases'
      />
      {isAddingAlias && (
        <AddAliasContainer>
          <NewEmailAliasInput
            didSubmit={didSubmit}
            helperText='You can use letters, numbers, and periods.'
            newAlias={newAlias}
            onEnter={() => void handleAddAliasClick}
            postSubmitError={postSubmitError}
            preSubmitError={preSubmitError}
            setAlias={setNewAlias}
            setDidSubmit={setDidSubmit}
            setPostSubmitError={setPostSubmitError}
            setPreSubmitError={setPreSubmitError}
            theme={theme}
            username={newAlias}
          />
          <Button disabled={loading} onClick={handleAddAliasClick}>
            Add
          </Button>
        </AddAliasContainer>
      )}
      {!!emailAliases.length && (
        <EmailAliasesContainer>
          {emailAliases.map((alias) => (
            <EmailAliasRow key={alias}>
              <EmailAliasUsername>
                <Avatar label={alias} />
                <Typography type='paragraph'>{alias}</Typography>
              </EmailAliasUsername>
              <AliasOptions emailAlias={alias} requestHcaptchaToken={requestHcaptchaToken} userID={userID} />
            </EmailAliasRow>
          ))}
        </EmailAliasesContainer>
      )}
      <ConfirmModal
        confirmName='Add alias'
        description='You will be able to send and receive mail at this alias.'
        onClose={() => setShowConfirmModal(false)}
        onConfirm={addAlias}
        open={showConfirmModal}
        title={`Add ${newAlias}@skiff.com`}
      />
      {/* Captcha for deleting aliases */}
      {hcaptchaElement}
    </>
  );
};

export default AddEmailAlias;
