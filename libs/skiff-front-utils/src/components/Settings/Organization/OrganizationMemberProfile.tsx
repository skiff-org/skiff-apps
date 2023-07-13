import { ApolloClient, ApolloError, NormalizedCacheObject } from '@apollo/client';
import { CircularProgress, FilledVariant, Icon, IconButton, Icons } from '@skiff-org/skiff-ui';
import React, { useEffect, useState } from 'react';
import { UserProfileDataFragment, useOrgMemberEmailAliasesQuery } from 'skiff-front-graphql';
import { PublicData, DocumentCollaborator } from 'skiff-graphql';
import { isSkiffAddress } from 'skiff-utils';
import styled from 'styled-components';

import { useRequiredCurrentUserData } from '../../../apollo';
import {
  useAllowAddCustomDomainAliases,
  useAsyncHcaptcha,
  useAvailableCustomDomains,
  useCreateAlias,
  useDeleteEmailAlias,
  useToast
} from '../../../hooks';
import useCurrentOrganization from '../../../hooks/useCurrentOrganization';
import useGetOrgMemberDefaultEmailAlias from '../../../hooks/useGetOrgMemberDefaultEmailAlias';
import useShareDocument from '../../../hooks/useShareDocument';
import { copyToClipboardWebAndMobile, splitEmailToAliasAndDomain } from '../../../utils';
import AccessLevelSelect from '../../AccessLevelSelect';
import { AccessUserType } from '../../AccessLevelSelect/AccessLevelSelect';
import { NewEmailAliasInput } from '../../NewEmailAliasInput';
import EmailAliasOptions from '../EmailAliases/EmailAliasOptions';
import UserProfileView, { UserProfileInfoRow } from '../shared/UserProfileView';

const LoadingContainer = styled.span`
  display: center;
`;

interface OrganizationMemberProfileProps {
  // Needed for shareDoc
  client: ApolloClient<NormalizedCacheObject>;
  member: DocumentCollaborator;
  setMember: (member?: DocumentCollaborator) => void;
  setUserIDtoConfirm: (userID: string | undefined) => void;
}

const OrganizationMemberProfile: React.FC<OrganizationMemberProfileProps> = ({
  client,
  member,
  setMember,
  setUserIDtoConfirm
}) => {
  const memberUserID = member.user.userID;
  const userData = useRequiredCurrentUserData();
  const { userID: currentUserID } = userData;

  // state hooks
  const [customDomain, setCustomDomain] = useState<string | undefined>(undefined);
  const [didSubmit, setDidSubmit] = useState(false);
  const [newAlias, setNewAlias] = useState('');
  const [error, setError] = useState('');
  const [memberEmailAliases, setMemberEmailAliases] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // custom hooks
  const { enqueueToast } = useToast();
  const availableDomains = useAvailableCustomDomains();

  const { data: orgData } = useCurrentOrganization();

  const organization = orgData?.organization;

  const { permissionLevel, user, sourceDocID } = member;

  const { updateUserDocPermission } = useShareDocument(client, sourceDocID);
  const { hcaptchaElement, requestHcaptchaToken } = useAsyncHcaptcha(false);
  const { addCustomDomainAlias } = useCreateAlias();
  const deleteEmailAlias = useDeleteEmailAlias(requestHcaptchaToken);

  // Only admins can add custom domain aliases
  const allowAddCustomDomainAliases = useAllowAddCustomDomainAliases();

  // graphql
  const { data: orgMemberEmailAliasesData } = useOrgMemberEmailAliasesQuery({
    variables: {
      userId: memberUserID
    }
  });
  useEffect(() => {
    if (orgMemberEmailAliasesData) {
      setMemberEmailAliases(orgMemberEmailAliasesData.orgMemberEmailAliases);
    }
  }, [orgMemberEmailAliasesData]);

  const copyToClipboard = (emailAlias: string) => {
    copyToClipboardWebAndMobile(emailAlias);
    enqueueToast({
      title: 'Email alias copied',
      body: `${emailAlias} is now in your clipboard.`
    });
  };

  const onBack = () => setMember(undefined);

  const { publicData } = (user as UserProfileDataFragment) || {};
  const { displayName, displayPictureData } = (publicData as PublicData) || {};

  const onAddAlias = async () => {
    if (customDomain) {
      try {
        await addCustomDomainAlias(newAlias, customDomain, memberUserID, setMemberEmailAliases);
        setNewAlias('');
      } catch (e) {
        setError((e as ApolloError).message);
      }
    } else {
      console.error('Can only add custom domain alias.');
    }
  };

  const defaultEmailAlias = useGetOrgMemberDefaultEmailAlias(memberUserID, user.username);

  const selectElement = loading ? (
    <LoadingContainer>
      <CircularProgress spinner />
    </LoadingContainer>
  ) : (
    <AccessLevelSelect
      dataTest='access-level-select'
      disabled={user.userID === currentUserID}
      docID={sourceDocID}
      onRemoveClick={() => {
        setLoading(true);
        setUserIDtoConfirm(memberUserID);
      }}
      selectedPermission={permissionLevel}
      setSelectedPermission={(newPermissionLevel) => {
        setLoading(true);
        void updateUserDocPermission({ userEmailOrID: memberUserID, permissionLevel: newPermissionLevel })
          .then(() => setMember({ ...member, permissionLevel: newPermissionLevel }))
          .catch((err) => console.error('Failed to update permission', err))
          .finally(() => {
            setLoading(false);
          });
      }}
      userType={AccessUserType.EXISTING}
    />
  );

  const tableRows: UserProfileInfoRow[] = memberEmailAliases.map((address) => {
    const { alias, domain } = splitEmailToAliasAndDomain(address);

    return {
      columns: [
        { value: alias, key: 'alias-col' },
        { value: domain, key: 'domain-col' }
      ],
      actions: isSkiffAddress(address) ? (
        <IconButton
          icon={<Icons color='disabled' icon={Icon.Copy} />}
          onClick={() => copyToClipboard(address)}
          variant={FilledVariant.UNFILLED}
        />
      ) : (
        <EmailAliasOptions
          alias={address}
          deleteAlias={() => void deleteEmailAlias(address, memberUserID, setMemberEmailAliases)}
          includeDeleteOption={memberEmailAliases.length > 1}
          userID={memberUserID}
        />
      ),
      key: address
    };
  });

  return (
    <>
      <UserProfileView
        columnHeaders={['ALIAS', 'DOMAIN']}
        createUploadLink={undefined} // undefined since we cant edit profile pictures of other org members
        displayName={displayName || defaultEmailAlias || ''}
        displayPictureData={displayPictureData ?? undefined}
        hideEditProfileSection={!organization}
        onBackClick={onBack}
        selectElement={selectElement}
        subtitle={!!displayName ? defaultEmailAlias : `Member of ${organization?.name ?? ''}`}
        userProfileInfoRows={tableRows}
      >
        {allowAddCustomDomainAliases && !!availableDomains.length && (
          <NewEmailAliasInput
            addAlias={() => void onAddAlias()}
            customDomains={availableDomains}
            didSubmit={didSubmit}
            disableSkiffDomain
            newAlias={newAlias}
            postSubmitError={error}
            preSubmitError={error}
            selectedCustomDomain={customDomain}
            setAlias={setNewAlias}
            setCustomDomain={setCustomDomain}
            setDidSubmit={setDidSubmit}
            setPostSubmitError={setError}
            setPreSubmitError={setError}
            username={newAlias}
          />
        )}
      </UserProfileView>
      {/* Captcha for deleting aliases */}
      {hcaptchaElement}
    </>
  );
};

export default OrganizationMemberProfile;
