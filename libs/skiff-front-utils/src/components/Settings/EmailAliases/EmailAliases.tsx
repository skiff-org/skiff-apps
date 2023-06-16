import { ApolloError } from '@apollo/client';
import { Icon } from 'nightwatch-ui';
import React, { useState } from 'react';
import { isPaywallErrorCode, PaywallErrorCode } from 'skiff-utils';
import styled from 'styled-components';

import { NewEmailAliasInput } from '../../NewEmailAliasInput';
import TitleActionSection from '../TitleActionSection';

import EmailAliasList from './EmailAliasList';

const EmailAliasesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

interface EmailAliasesProps {
  userEmailAliases: string[];
  userID: string;
  hcaptchaElement: JSX.Element;
  isAddingAlias: boolean;
  includeDeleteOption: boolean;
  createEmailAlias: (alias: string, customDomain?: string) => Promise<void>;
  deleteEmailAlias: (alias: string) => Promise<void>;
  openPaywallModal: (paywallErrorCode: PaywallErrorCode) => void;
  onSetDefaultAlias?: (newValue: string) => void;
  /**
   * A list of the user's custom domains
   * Undefined indicates that the user is not an admin
   * hence is not allowed to create custom domain aliases
   */
  userCustomDomains?: string[];
  openAddAlias?: boolean;
}

/**
 * Component for rendering the interface to add email aliases.
 */
const EmailAliases = ({
  userEmailAliases,
  userID,
  hcaptchaElement,
  isAddingAlias,
  includeDeleteOption,
  createEmailAlias,
  deleteEmailAlias,
  openPaywallModal,
  onSetDefaultAlias,
  userCustomDomains,
  openAddAlias
}: EmailAliasesProps) => {
  // State
  const [showNewEmailAliasInput, setShowNewEmailAliasInput] = useState(!!openAddAlias);
  const [newAlias, setNewAlias] = useState('');
  const [preSubmitError, setPreSubmitError] = useState('');
  const [postSubmitError, setPostSubmitError] = useState('');
  const [didSubmit, setDidSubmit] = useState(false);
  const [customDomain, setCustomDomain] = useState<string | undefined>(undefined);

  // Resets all values
  const onReset = () => {
    setShowNewEmailAliasInput(false);
    setDidSubmit(false);
    setNewAlias('');
    // Clear any previous errors
    setPreSubmitError('');
    setPostSubmitError('');
  };

  const onAddAlias = async () => {
    try {
      await createEmailAlias(newAlias, customDomain);
      onReset();
    } catch (e) {
      // Typescript won't allow us to annotate `e` as ApolloError above, so
      // we cast it below
      const code = (e as ApolloError)?.graphQLErrors?.[0].extensions.code as PaywallErrorCode;
      if (isPaywallErrorCode(code)) openPaywallModal(code);
      else setPostSubmitError((e as ApolloError).message);
    }
  };

  return (
    <div>
      <EmailAliasesContainer>
        <TitleActionSection
          actions={[
            {
              onClick: showNewEmailAliasInput ? onReset : () => setShowNewEmailAliasInput(true),
              label: showNewEmailAliasInput ? 'Cancel' : 'Add alias',
              type: 'button',
              icon: showNewEmailAliasInput ? Icon.Close : Icon.Plus
            }
          ]}
          subtitle='Create additional addresses for sending and receiving mail'
          title='Email aliases'
        />
        {showNewEmailAliasInput && (
          <NewEmailAliasInput
            addAlias={() => void onAddAlias()}
            customDomains={userCustomDomains}
            didSubmit={didSubmit}
            helperText='You can use letters, numbers, and periods.'
            isAddingAlias={isAddingAlias}
            newAlias={newAlias}
            postSubmitError={postSubmitError}
            preSubmitError={preSubmitError}
            selectedCustomDomain={customDomain}
            setAlias={setNewAlias}
            setCustomDomain={setCustomDomain}
            setDidSubmit={setDidSubmit}
            setPostSubmitError={setPostSubmitError}
            setPreSubmitError={setPreSubmitError}
            username={newAlias}
          />
        )}
        <EmailAliasList
          allAliases={userEmailAliases}
          deleteAlias={deleteEmailAlias}
          includeDeleteOption={includeDeleteOption}
          onSetDefaultAlias={onSetDefaultAlias}
          userID={userID}
        />
      </EmailAliasesContainer>
      {/* Captcha for deleting aliases */}
      {hcaptchaElement}
    </div>
  );
};

export default EmailAliases;
