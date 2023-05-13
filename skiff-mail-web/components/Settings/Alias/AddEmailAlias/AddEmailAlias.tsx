import React from 'react';
import { useDispatch } from 'react-redux';
import { useGetCurrentUserCustomDomainsQuery } from 'skiff-front-graphql';
import {
  EmailAliases,
  useRequiredCurrentUserData,
  useCreateAlias,
  useAllowAddCustomDomainAliases,
  useDeleteEmailAlias,
  SettingValue
} from 'skiff-front-utils';
import { CustomDomainStatus, PaywallErrorCode } from 'skiff-utils';

import { skemailModalReducer } from '../../../../redux/reducers/modalReducer';
import { ModalType } from '../../../../redux/reducers/modalTypes';
import { resolveAndSetENSDisplayName } from '../../../../utils/userUtils';
import { useSettings } from '../../useSettings';

interface AddEmailAliasProps {
  emailAliases: string[];
  hcaptchaElement: JSX.Element;
  requestHcaptchaToken: () => Promise<string>;
  includeDeleteOption: boolean;
}

/**
 * Component for rendering the interface to add email aliases.
 */
export const AddEmailAlias = ({
  emailAliases,
  hcaptchaElement,
  requestHcaptchaToken,
  includeDeleteOption
}: AddEmailAliasProps) => {
  /** Custom hooks */
  const deleteEmailAlias = useDeleteEmailAlias(requestHcaptchaToken);
  const { addCustomDomainAlias, addEmailAlias, isLoading: isCreatingAlias } = useCreateAlias();
  const { querySearchParams } = useSettings();

  // Only admins can add custom domain aliases
  const allowAddCustomDomainAliases = useAllowAddCustomDomainAliases();
  const user = useRequiredCurrentUserData();

  /** Redux */
  const dispatch = useDispatch();
  const openPaywallModal = (paywallErrorCode: PaywallErrorCode) =>
    dispatch(
      skemailModalReducer.actions.setOpenModal({
        type: ModalType.Paywall,
        paywallErrorCode
      })
    );

  /** Graphql */
  const { data: customDomainData } = useGetCurrentUserCustomDomainsQuery();
  const customDomains =
    customDomainData?.getCurrentUserCustomDomains.domains
      .filter((domain) => domain.verificationStatus === CustomDomainStatus.VERIFIED)
      .map(({ domain }) => domain) ?? [];

  const createEmailAlias = async (newAlias: string, customDomain?: string) => {
    if (customDomain) await addCustomDomainAlias(newAlias, customDomain);
    else await addEmailAlias(newAlias);
  };

  const onSetDefaultAlias = (newValue: string) => void resolveAndSetENSDisplayName(newValue, user);

  return (
    <EmailAliases
      createEmailAlias={createEmailAlias}
      deleteEmailAlias={deleteEmailAlias}
      hcaptchaElement={hcaptchaElement}
      includeDeleteOption={includeDeleteOption}
      isAddingAlias={isCreatingAlias}
      onSetDefaultAlias={onSetDefaultAlias}
      openAddAlias={querySearchParams.setting === SettingValue.AddEmailAlias}
      openPaywallModal={openPaywallModal}
      userCustomDomains={allowAddCustomDomainAliases ? customDomains : undefined}
      userEmailAliases={emailAliases}
      userID={user.userID}
    />
  );
};

export default AddEmailAlias;
