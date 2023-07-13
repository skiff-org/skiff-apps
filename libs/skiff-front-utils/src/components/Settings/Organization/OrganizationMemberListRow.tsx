import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  CircularProgress,
  Dropdown,
  DropdownItem,
  FilledVariant,
  Icon,
  IconButton,
  Icons,
  ThemeMode,
  Type
} from '@skiff-org/skiff-ui';
import React, { useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import Drawer from '../../Drawer';
import {
  PendingUserInvite,
  UserProfileDataFragment,
  useDeleteInviteMutation,
  useGetCollaboratorsQuery
} from 'skiff-front-graphql';
import { PermissionLevel, RequestStatus } from 'skiff-graphql';
import styled from 'styled-components';

import { useRequiredCurrentUserData } from '../../../apollo';
import useCurrentOrganization from '../../../hooks/useCurrentOrganization';
import useGetOrgMemberDefaultEmailAlias from '../../../hooks/useGetOrgMemberDefaultEmailAlias';
import useShareDocument from '../../../hooks/useShareDocument';
import useToast from '../../../hooks/useToast';
import { getDisplayPictureDataFromUser } from '../../../utils/userUtils';
import { currentUserIsWorkspaceAdmin } from '../../../utils/workspaceUtils';
import AccessLevelSelect from '../../AccessLevelSelect';
import { AccessUserType } from '../../AccessLevelSelect/AccessLevelSelect';
import UserListRow from '../shared/UserListRow';

const LoadingContainer = styled.span`
  display: center;
`;

const PendingIconContainer = styled.div`
  margin-left: ${isMobile ? '' : 'auto'};
`;

const ForwardIconContainer = styled.div`
  margin-left: ${isMobile ? '' : 'auto'};
  margin-right: ${isMobile ? '' : '9px'};
`;

interface OrganizationMemberListRowProps {
  client: ApolloClient<NormalizedCacheObject>;
  dataTest: string;
  isLast: boolean;
  member: UserProfileDataFragment;
  permission: PermissionLevel;
  setUserIDtoConfirm: (userID: string | undefined) => void;
  docID?: string;
  pendingInvite?: PendingUserInvite;
  updateMemberAccessPermissions?: (value: PermissionLevel) => Promise<void>;
  onClick?: () => void;
}

enum PendingInviteOptions {
  ResendInvite = 'RESEND',
  DeleteInvite = 'DELETE'
}

/**
 * Component that renders a stylized username box containing: the user's avatar,
 * username, and role/ workspace invite status
 */
const OrganizationMemberListRow: React.FC<OrganizationMemberListRowProps> = ({
  client,
  dataTest,
  member,
  isLast,
  updateMemberAccessPermissions,
  onClick,
  permission,
  pendingInvite,
  docID: docIDProp,
  setUserIDtoConfirm
}: OrganizationMemberListRowProps) => {
  const buttonRef = useRef(null);
  const [showPendingDropdown, setShowPendingDropdown] = useState(false);
  const displayPictureData = getDisplayPictureDataFromUser(member);
  const { data: activeOrgData } = useCurrentOrganization();
  const [loading, setLoading] = useState(false);
  const username = typeof member === 'string' ? member : member.username;

  const defaultEmailAlias = useGetOrgMemberDefaultEmailAlias(member.userID, username, !!pendingInvite);

  const displayName = member.publicData.displayName || defaultEmailAlias;

  const { enqueueToast } = useToast();
  const { docID: pendingInviteDocID, email } = pendingInvite ?? { docID: '', email: '' };
  const [deleteInvite] = useDeleteInviteMutation();
  const docID = docIDProp ?? pendingInviteDocID;

  const { shareUsers } = useShareDocument(client, docID);

  const isWorkspaceAdmin = currentUserIsWorkspaceAdmin(activeOrgData?.organization);

  const [isHovering, setIsHovering] = useState(false);
  const { userID } = useRequiredCurrentUserData();

  const { refetch } = useGetCollaboratorsQuery({
    variables: {
      request: {
        docID
      }
    },
    skip: !docID
  });

  const handleSelectResend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const orgEveryoneTeamDocID = activeOrgData?.organization.everyoneTeam.rootDocument?.docID;

    try {
      if (!orgEveryoneTeamDocID) {
        throw new Error('Missing org everyone team root docID');
      }

      const { error } = await shareUsers([{ userEmailOrID: email, permissionLevel: PermissionLevel.Editor }]);
      if (error) throw new Error(error);

      enqueueToast({ title: 'Invite resent', body: `Invite to ${email} has been resent.` });
    } catch (err) {
      console.error('Failed to resend invite', e);
      enqueueToast({ title: 'Invite resend failed', body: `Failed to resend invite to ${email}.` });
    }

    await refetch();
  };

  const handleSelectDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const response = await deleteInvite({ variables: { request: { docID, email } } });
      if (response.data?.deleteInvite.status === RequestStatus.Success) {
        enqueueToast({
          title: 'User removed',
          body: `${email} has been removed from the organization.`
        });
      }
    } catch (err) {
      console.error('Failed to delete invite', err);
      enqueueToast({ title: 'Delete invite failed', body: `Failed to delete invite to ${email}.` });
    }

    await refetch();
  };

  const getSubtitle = (): string | undefined => {
    if (pendingInvite) return 'Pending response';
    if (displayName === defaultEmailAlias) return undefined;
    return defaultEmailAlias;
  };

  return (
    <UserListRow
      avatarDisplayData={!!pendingInvite ? Icon.Clock : displayPictureData}
      dataTest={dataTest}
      displayName={displayName}
      isLast={isLast}
      onClick={onClick}
      setIsHovering={setIsHovering}
      subtitle={getSubtitle()}
      subtitleColor={pendingInvite ? 'tertiary' : 'secondary'}
    >
      {loading && (
        <LoadingContainer>
          <CircularProgress spinner />
        </LoadingContainer>
      )}
      {!loading && updateMemberAccessPermissions && (
        <>
          <div data-test={`${dataTest}-${member.username}`}>
            <AccessLevelSelect
              dataTest='access-level-select'
              disabled={member.userID === userID || !!pendingInvite}
              docID={docID}
              onRemoveClick={
                // Only show remove option if this is not a pending invite
                pendingInvite
                  ? undefined
                  : () => {
                      if (!activeOrgData) return;
                      setUserIDtoConfirm(member.userID);
                    }
              }
              selectedPermission={permission}
              setSelectedPermission={(value) => {
                setLoading(true);
                updateMemberAccessPermissions(value)
                  .then(() => setLoading(false))
                  .catch(() => setLoading(false));
              }}
              userType={AccessUserType.EXISTING}
            />
          </div>
        </>
      )}
      {pendingInvite && (
        <PendingIconContainer>
          <IconButton
            dataTest='pending-user-options'
            icon={Icon.OverflowH}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setShowPendingDropdown(true);
            }}
            ref={buttonRef}
            type={Type.SECONDARY}
            variant={FilledVariant.UNFILLED}
          />
          {!isMobile && (
            <Dropdown
              buttonRef={buttonRef}
              minWidth={160}
              portal
              setShowDropdown={setShowPendingDropdown}
              showDropdown={showPendingDropdown}
            >
              <DropdownItem
                icon={Icon.Send}
                label='Resend'
                onClick={handleSelectResend}
                value={PendingInviteOptions.ResendInvite}
              />
              <DropdownItem
                color='destructive'
                icon={Icon.Trash}
                label='Delete'
                onClick={handleSelectDelete}
                value={PendingInviteOptions.DeleteInvite}
              />
            </Dropdown>
          )}
          {isMobile && (
            <Drawer
              forceTheme={ThemeMode.DARK}
              hideDrawer={() => {
                setShowPendingDropdown(false);
              }}
              show={showPendingDropdown}
            >
              <DropdownItem
                icon={Icon.Send}
                label='Resend'
                onClick={handleSelectResend}
                value={PendingInviteOptions.ResendInvite}
              />
              <DropdownItem
                color='destructive'
                hideDivider
                icon={Icon.Trash}
                label='Delete'
                onClick={handleSelectDelete}
                value={PendingInviteOptions.DeleteInvite}
              />
            </Drawer>
          )}
        </PendingIconContainer>
      )}
      {!pendingInvite && isWorkspaceAdmin && (
        <ForwardIconContainer>
          <Icons color={isHovering ? 'secondary' : 'disabled'} icon={Icon.Forward} onClick={() => {}} />
        </ForwardIconContainer>
      )}
    </UserListRow>
  );
};

export default OrganizationMemberListRow;
