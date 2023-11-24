import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import React, { useState } from 'react';
import { GetOrganizationMembersDocument, useDeleteUserOrganizationMembershipMutation } from 'skiff-front-graphql';
import { DocumentCollaborator } from 'skiff-graphql';

import { useCurrentOrganization } from '../../../hooks';
import ConfirmModal from '../../modals/ConfirmModal';
import { SettingsPage } from '../Settings.types';

import OrganizationMemberListTable from './OrganizationMemberListTable';
import OrganizationMemberProfile from './OrganizationMemberProfile';

interface OrganizationMemberListProps {
  client: ApolloClient<NormalizedCacheObject>;
  // Each app has it's own state to control the Settings modal
  openSettings: (page: SettingsPage) => void;
}

const OrganizationMemberList: React.FC<OrganizationMemberListProps> = ({ client, openSettings }) => {
  const [member, setMember] = useState<DocumentCollaborator | undefined>();
  const { data: activeOrg } = useCurrentOrganization();
  const [deleteUserOrganizationMembershipMutation] = useDeleteUserOrganizationMembershipMutation({
    refetchQueries: [{ query: GetOrganizationMembersDocument, variables: { id: activeOrg?.organization?.orgID } }]
  });
  const [userIDtoConfirm, setUserIDtoConfirm] = useState<string | undefined>(undefined);

  return (
    <>
      {!member && (
        <OrganizationMemberListTable
          client={client}
          openSettings={openSettings}
          setMember={setMember}
          setUserIDtoConfirm={setUserIDtoConfirm}
        />
      )}
      {member && (
        <OrganizationMemberProfile
          client={client}
          member={member}
          setMember={setMember}
          setUserIDtoConfirm={setUserIDtoConfirm}
        />
      )}
      <ConfirmModal
        confirmName='Delete'
        description='Confirming will remove user from organization and delete their account.'
        destructive
        onClose={() => {
          setUserIDtoConfirm(undefined);
        }}
        onConfirm={async () => {
          if (!activeOrg || !userIDtoConfirm) return;
          await deleteUserOrganizationMembershipMutation({
            variables: {
              request: {
                orgID: activeOrg.organization.orgID,
                userID: userIDtoConfirm
              }
            }
          });
          setUserIDtoConfirm(undefined);
          // go back to main settings page
          setMember(undefined);
        }}
        open={!!userIDtoConfirm}
        title='Remove member?'
      />
    </>
  );
};

export default OrganizationMemberList;
