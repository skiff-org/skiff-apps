import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DisplayPictureData,
  useCreateOrgUploadAvatarLinkMutation,
  useEditOrganizationMutation,
  useGetOrganizationMembersQuery
} from 'skiff-front-graphql';
import { CreateUploadAvatarLinkResponse, PermissionLevel } from 'skiff-graphql';

import useCurrentOrganization from '../../../hooks/useCurrentOrganization';
import EditProfile from '../../EditProfile';
import TitleActionSection from '../TitleActionSection';

/**
 * Component for changing account color and photo (settings modal only)
 */
const OrganizationName: React.FC = () => {
  const { data: orgData } = useCurrentOrganization();
  const orgID = orgData?.organization.orgID;

  const { data: orgMemberData, refetch: refetchOrgMembers } = useGetOrganizationMembersQuery({
    variables: { id: orgID ?? '' },
    skip: !orgID
  });

  const [editOrganization] = useEditOrganizationMutation();
  const organization = orgMemberData?.organization;

  const [createOrgUploadAvatarLinkMutation] = useCreateOrgUploadAvatarLinkMutation();

  /** Text content inside text field */
  const [orgNameStateField, setOrgNameStateField] = useState(organization?.name || '');

  const updateOrgName = async (name: string) => {
    if (organization?.orgID) {
      await editOrganization({
        variables: { request: { orgID: organization.orgID, name } }
      });
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);

  // To account for loading from Apollo -- when display name gets filled in,
  // update our local state field
  useEffect(() => setOrgNameStateField(organization?.name || ''), [organization?.name]);

  const save = async () => {
    await updateOrgName(orgNameStateField);
    if (inputRef?.current) inputRef.current.blur();
  };

  const onChange = (evt: { target: { value: string } }) => setOrgNameStateField(evt.target.value);

  const onBlur = () => {
    setTimeout(() => {
      if (document.activeElement?.id === 'edit-profile-btn') {
        return; // ignore save button click
      }
      void save();
    }, 1);
  };

  const onKeyDown = (evt: React.KeyboardEvent) => {
    if (evt.key === 'Enter') {
      void save();
    }
  };

  const setDisplayPictureData = useCallback(
    async (updatedDisplayPictureData: DisplayPictureData) => {
      if (!organization?.orgID) return;
      const { profileAccentColor, profileCustomURI } = updatedDisplayPictureData || {};
      await editOrganization({
        variables: {
          request: {
            orgID: organization.orgID,
            displayPictureData: {
              profileAccentColor,
              profileCustomURI
            }
          }
        }
      });
      void refetchOrgMembers();
    },
    [organization?.orgID, editOrganization, refetchOrgMembers]
  );

  const createUploadOrgPictureLink = async (): Promise<CreateUploadAvatarLinkResponse | undefined> => {
    if (!orgID) {
      console.error('Failed to create upload avatar link: Missing orgID');
      return;
    }

    const { data: avatarLink, errors } = await createOrgUploadAvatarLinkMutation();

    if (errors || !avatarLink?.createOrgUploadAvatarLink) {
      console.error('Error creating upload avatar link', errors);
      return;
    }

    return avatarLink?.createOrgUploadAvatarLink;
  };

  const isAdmin = organization?.everyoneTeam.rootDocument?.currentUserPermissionLevel === PermissionLevel.Admin;
  return (
    <>
      <EditProfile
        createUploadLink={createUploadOrgPictureLink}
        displayName={organization?.name}
        displayPictureData={organization?.displayPictureData}
        setDisplayPictureData={setDisplayPictureData}
      />
      <TitleActionSection
        actions={[
          {
            innerRef: inputRef,
            dataTest: 'edit-org-name-input',
            onChange,
            onBlur,
            onKeyDown,
            disabled: !isAdmin,
            value: orgNameStateField,
            placeholder: 'Nightwatch Inc.',
            type: 'input'
          }
        ]}
        subtitle='The name used for your shared organization'
        title='Organization name'
      />
    </>
  );
};

export default OrganizationName;
