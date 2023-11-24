import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { PaywallErrorCode } from 'skiff-utils';
import { useRequiredCurrentUserData } from '../../../../apollo';
import { useAllowAddCustomDomainAliases, useAvailableCustomDomains, useDeleteEmailAlias } from '../../../../hooks';
import { resolveAndSetENSDisplayName } from '../../../../utils';
import { SettingsPage } from '../../Settings.types';
import EmailAliases from '../EmailAliases';

interface AddEmailAliasProps {
  emailAliases: string[];
  hcaptchaElement: JSX.Element;
  requestHcaptchaToken: () => Promise<string>;
  includeDeleteOption: boolean;
  setSelectedAddress: (address: string | undefined) => void;
  client: ApolloClient<NormalizedCacheObject>;
  openSettings: (page: SettingsPage) => void;
  openPaywallModal: (paywallErrorCode: PaywallErrorCode) => void;
  selectedAddress: string | undefined;
}

/**
 * Component for rendering the interface to add email aliases.
 */
export const AddEmailAlias = ({
  emailAliases,
  hcaptchaElement,
  requestHcaptchaToken,
  includeDeleteOption,
  setSelectedAddress,
  openSettings,
  openPaywallModal,
  selectedAddress,
  client
}: AddEmailAliasProps) => {
  /** Custom hooks */
  const deleteEmailAlias = useDeleteEmailAlias(requestHcaptchaToken);

  const user = useRequiredCurrentUserData();
  // Only admins can add custom domain aliases
  const allowAddCustomDomainAliases = useAllowAddCustomDomainAliases();
  const availableCustomDomains = useAvailableCustomDomains();
  const customDomains = allowAddCustomDomainAliases ? availableCustomDomains : undefined;

  const onSetDefaultAlias = (newValue: string) => void resolveAndSetENSDisplayName(newValue, user, client);

  return (
    <EmailAliases
      client={client}
      deleteEmailAlias={deleteEmailAlias}
      hcaptchaElement={hcaptchaElement}
      includeDeleteOption={includeDeleteOption}
      onSetDefaultAlias={onSetDefaultAlias}
      openPaywallModal={openPaywallModal}
      openSettings={(page) => !!page.indices.tab && openSettings(page)}
      userCustomDomains={customDomains}
      userEmailAliases={emailAliases}
      userID={user.userID}
      setSelectedAddress={setSelectedAddress}
      selectedAddress={selectedAddress}
    />
  );
};

export default AddEmailAlias;
