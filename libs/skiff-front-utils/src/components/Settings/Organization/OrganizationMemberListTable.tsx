import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { Divider, InputField, Skeleton } from '@skiff-org/skiff-ui';
import React, { useState } from 'react';
import { DocumentCollaborator, PermissionLevel } from 'skiff-graphql';
import { assertExists } from 'skiff-utils';
import styled from 'styled-components';

import { useCurrentOrganization } from '../../../hooks';
import useShareDocument from '../../../hooks/useShareDocument';
import { userMatchesSearchQuery } from '../../../utils/userUtils';
import { currentUserIsWorkspaceAdmin } from '../../../utils/workspaceUtils';
import { AddTeamMemberModal } from '../../modals/AddTeamMemberModal';
import { SettingsPage } from '../Settings.types';
import UserListTable, { UserListTableSection } from '../shared/UserListTable';

import OrganizationMemberListRow from './OrganizationMemberListRow';
import OrganizationName from './OrganizationName';

interface OrganizationMemberListTableProps {
  client: ApolloClient<NormalizedCacheObject>;
  setMember: (member?: DocumentCollaborator) => void;
  setUserIDtoConfirm: (userID: string | undefined) => void;
  openSettings: (page: SettingsPage) => void;
}

const Skeletons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const OrganizationMemberListTable: React.FC<OrganizationMemberListTableProps> = ({
  client,
  setMember,
  setUserIDtoConfirm,
  openSettings
}) => {
  const [searchValue, setSearchValue] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);

  const { data: orgData, loading } = useCurrentOrganization();
  const organization = orgData?.organization;
  // every member of org is a collaborator on everyone team root doc
  const allOrgMembers = organization?.everyoneTeam?.rootDocument?.collaborators ?? [];
  const pendingOrgMembers = organization?.everyoneTeam?.rootDocument?.invites ?? [];

  const filteredMembers = !!searchValue
    ? allOrgMembers.filter((member) => userMatchesSearchQuery(member.user, searchValue))
    : allOrgMembers;

  const filteredPendingMembers = !!searchValue
    ? pendingOrgMembers.filter((member) => member.email.toLowerCase().includes(searchValue.toLowerCase()))
    : pendingOrgMembers;

  const { updateUserDocPermission } = useShareDocument(client, organization?.everyoneTeam.rootDocument?.docID ?? '');

  // determine whether user is org admin
  // note that this defaults to no, given the assumption that the user is already on the org's everyone team
  const getUserOrgPermissionLevel = (curUserID: string) => {
    const curLevel = organization?.everyoneTeam?.rootDocument?.collaborators.find(
      (collaborator) => collaborator.user.userID === curUserID
    )?.permissionLevel;
    // if null, which should not happen (because user is an org member), return editor (minimum level)
    return curLevel || PermissionLevel.Editor;
  };

  const currentUserIsAdmin = currentUserIsWorkspaceAdmin(orgData?.organization);

  if (loading) {
    return (
      <Skeletons>
        <Skeleton height='50px' width='100%' />
        <Skeleton height='30px' width='100%' />
        <Skeleton height='30px' width='100%' />
      </Skeletons>
    );
  }

  if (!organization) {
    return null;
  }

  const openShare = () => setShareModalOpen(true);

  const inputField = (
    <InputField
      dataTest='settings-search-members'
      errorMsg={errorMsg}
      onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
        setErrorMsg('');
        setSearchValue(evt.target.value);
      }}
      onKeyPress={(evt: React.KeyboardEvent) => {
        if (evt.key === 'Enter') {
          setShareModalOpen(true);
        }
      }}
      placeholder='Search members'
      value={searchValue}
    />
  );

  const pendingMembersSection: UserListTableSection | null =
    filteredPendingMembers.length > 0
      ? {
          columnHeaders: ['PENDING INVITES', 'ROLE'],
          rows: filteredPendingMembers.map((member, index) => (
            <OrganizationMemberListRow
              client={client}
              dataTest='organization-member'
              isLast={index === filteredPendingMembers.length - 1}
              key={member.email}
              member={{ userID: member.email, username: member.email, publicData: {} }}
              pendingInvite={member}
              permission={member.permissionLevel}
              setUserIDtoConfirm={setUserIDtoConfirm}
              updateMemberAccessPermissions={async () => {}}
            />
          ))
        }
      : null;

  const orgMembersSection: UserListTableSection = {
    columnHeaders: ['USERS', 'ROLE'],
    rows: filteredMembers.map((member, index) => (
      <OrganizationMemberListRow
        client={client}
        dataTest='organization-member'
        docID={organization.everyoneTeam?.rootDocument?.docID}
        isLast={index === filteredMembers.length - 1}
        key={member.user.userID}
        member={member.user}
        onClick={() => {
          setMember(member as DocumentCollaborator);
        }}
        permission={getUserOrgPermissionLevel(member.user.userID)}
        setUserIDtoConfirm={setUserIDtoConfirm}
        updateMemberAccessPermissions={async (newPermissionLevel) => {
          assertExists(organization.everyoneTeam.rootDocument);
          await updateUserDocPermission({ userEmailOrID: member.user.userID, permissionLevel: newPermissionLevel });
        }}
      />
    )),
    emptyText: 'No members found.'
  };

  // Filter out pendingMembersSection if it's null because it has no members
  const tableSections: UserListTableSection[] = [pendingMembersSection, orgMembersSection].filter(
    Boolean
  ) as UserListTableSection[];

  return (
    <>
      <OrganizationName />
      <Divider />
      <UserListTable
        addButtonDataTest='settings-invite-member'
        addButtonLabel='Add members'
        header='Members'
        headerNumber={filteredMembers.length}
        inputField={inputField}
        onAddButtonClick={openShare}
        sections={tableSections}
        showAddButton={currentUserIsAdmin}
      />
      {organization.everyoneTeam?.rootDocument && (
        <AddTeamMemberModal
          client={client}
          everyoneTeamDocID={organization.everyoneTeam.rootDocument.docID}
          onClose={() => setShareModalOpen(false)}
          open={shareModalOpen}
          openSettings={openSettings}
          workspaceName={organization.name}
        />
      )}
    </>
  );
};

export default OrganizationMemberListTable;
