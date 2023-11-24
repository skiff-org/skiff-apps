import { ApolloClient, ApolloError, NormalizedCacheObject } from '@apollo/client';
import { useState } from 'react';
import { isPaywallErrorCode, PaywallErrorCode } from 'skiff-utils';
import styled from 'styled-components';

import { useCreateAlias } from '../../../hooks';
import AliasProfileModal from '../../modals/AliasProfileModal';
import { SettingsPage } from '../../Settings/Settings.types';
import TitleActionSection from '../TitleActionSection';

import EmailAliasList from './EmailAliasList';

const EmailAliasesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

interface EmailAliasesProps {
  client: ApolloClient<NormalizedCacheObject>;
  userEmailAliases: string[];
  userID: string;
  hcaptchaElement: JSX.Element;
  includeDeleteOption: boolean;
  deleteEmailAlias: (alias: string) => Promise<void>;
  openPaywallModal: (paywallErrorCode: PaywallErrorCode) => void;
  onSetDefaultAlias?: (newValue: string) => void;
  /**
   * A list of the user's custom domains
   * Undefined indicates that the user is not an admin
   * hence is not allowed to create custom domain aliases
   */
  userCustomDomains?: string[];
  openSettings?: (page: SettingsPage) => void;
  setSelectedAddress?: (address: string | undefined) => void;
  selectedAddress?: string;
}

/**
 * Component for rendering the interface to add email aliases.
 */
const EmailAliases = ({
  client,
  userEmailAliases,
  userID,
  hcaptchaElement,
  includeDeleteOption,
  deleteEmailAlias,
  openPaywallModal,
  onSetDefaultAlias,
  userCustomDomains,
  openSettings,
  setSelectedAddress,
  selectedAddress
}: EmailAliasesProps) => {
  // State
  const [showNewEmailAliasInput, setShowNewEmailAliasInput] = useState(false);
  const [newAlias, setNewAlias] = useState('');
  const [preSubmitError, setPreSubmitError] = useState<string | undefined>(undefined);
  const [postSubmitError, setPostSubmitError] = useState<string | undefined>(undefined);
  const [customDomain, setCustomDomain] = useState<string | undefined>(undefined);

  // Custom hooks
  const { addCustomDomainAlias, addEmailAlias, isLoading: isAddingAlias } = useCreateAlias();

  // Resets all values
  const onReset = () => {
    setShowNewEmailAliasInput(false);
    setNewAlias('');
    // Clear any previous errors
    setPreSubmitError('');
    setPostSubmitError('');
  };

  const onAddAlias = async () => {
    try {
      if (customDomain) await addCustomDomainAlias(newAlias, customDomain);
      else {
        await addEmailAlias(newAlias);
      }
      onReset();
      return true;
    } catch (e) {
      // Typescript won't allow us to annotate `e` as ApolloError above, so
      // we cast it below
      const code = (e as ApolloError)?.graphQLErrors?.[0].extensions.code as PaywallErrorCode;
      if (isPaywallErrorCode(code)) openPaywallModal(code);
      else setPostSubmitError((e as ApolloError).message);
      return false;
    }
  };

  return (
    <div>
      <EmailAliasesContainer>
        <TitleActionSection
          actions={[
            {
              onClick: () => setShowNewEmailAliasInput(true),
              label: 'Add address',
              type: 'button'
            }
          ]}
          subtitle='Create additional addresses for sending and receiving mail'
          title='Email addresses'
        />
        <AliasProfileModal
          addAlias={onAddAlias}
          alias={newAlias}
          allEmailAliases={userEmailAliases}
          client={client}
          customDomains={userCustomDomains}
          helperText={!!customDomain ? undefined : 'You can use letters, numbers, and periods.'}
          isAddingAlias={isAddingAlias}
          isOpen={showNewEmailAliasInput}
          postSubmitError={postSubmitError}
          preSubmitError={preSubmitError}
          selectedCustomDomain={customDomain}
          setAlias={setNewAlias}
          setCustomDomain={setCustomDomain}
          setIsOpen={setShowNewEmailAliasInput}
          setPostSubmitError={setPostSubmitError}
          setPreSubmitError={setPreSubmitError}
          username={newAlias}
        />
        <EmailAliasList
          allAliases={userEmailAliases}
          client={client}
          deleteAlias={deleteEmailAlias}
          includeDeleteOption={includeDeleteOption}
          onSetDefaultAlias={onSetDefaultAlias}
          openSettings={openSettings}
          userID={userID}
          selectedAddress={selectedAddress}
          setSelectedAddress={setSelectedAddress}
        />
      </EmailAliasesContainer>
      {/* Captcha for deleting aliases */}
      {hcaptchaElement}
    </div>
  );
};

export default EmailAliases;
