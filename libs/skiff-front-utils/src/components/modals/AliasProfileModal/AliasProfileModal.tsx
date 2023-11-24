import { ButtonGroup, ButtonGroupItem, Dialog, ThemeMode } from 'nightwatch-ui';
import { useState } from 'react';
import { isMobile } from 'react-device-detect';
import {
  useGetFullAliasInfoQuery,
  useStoreWorkspaceEventMutation,
  useUpdateEmailAliasProfileMutation
} from 'skiff-front-graphql';
import { DisplayPictureData, WorkspaceEventType } from 'skiff-graphql';
import { isPremiumUsername } from 'skiff-utils';
import styled from 'styled-components';

import { DEFAULT_WORKSPACE_EVENT_VERSION } from '../../../constants';
import { useToast } from '../../../hooks';
import Drawer from '../../Drawer';

import { AliasProfileModalProps } from './AliasProfileModal.types';
import DisplayNameSection from './DisplayNameSection';
import DisplayPictureSection from './DisplayPictureSection';
import EmailAliasSection from './EmailAliasSection';

const ContentContainer = styled.div`
  width: 100%;

  display: flex;
  flex-direction: column;
  gap: 32px;

  padding: ${isMobile ? '12px 8px' : '12px'};
  box-sizing: border-box;

  ${!isMobile &&
  `
    border: 1px solid var(--border-primary);
    border-radius: 16px;
  `}
`;

const ButtonGroupContainer = styled.div`
  ${isMobile && 'padding: 0 8px;'}
  width: 100%;
`;

function AliasProfileModal({
  alias,
  client,
  isOpen,
  setIsOpen,
  addAlias,
  // New email alias props
  preSubmitError,
  postSubmitError,
  setAlias,
  setPreSubmitError,
  setPostSubmitError,
  allEmailAliases,
  ...newEmailAliasInputProps
}: AliasProfileModalProps) {
  // State
  // Edited display name
  const [newDisplayName, setNewDisplayName] = useState<string | undefined>(undefined);
  // Edited alias display picture data
  const [newDisplayPictureData, setNewDisplayPictureData] = useState<DisplayPictureData>();
  // Create alias confirm dialog opened/closed state
  const [isAddAliasConfirmOpen, setIsAddAliasConfirmOpen] = useState(false);

  // Custom hooks
  const { enqueueToast } = useToast();

  // Graphql
  const [updateAliasProfile] = useUpdateEmailAliasProfileMutation();
  // Data for the alias profile is derived from the alias info query
  const { data: aliasData, refetch } = useGetFullAliasInfoQuery();
  // Alias-specific data - note we use the full alias query so that refetch updates the full list properly on save
  const dataForThisAlias = aliasData?.fullAliasInfo?.find((aliasInfo) => aliasInfo?.emailAlias === alias);
  // Current, unedited alias display name and display picture data
  const { displayName: currDisplayName, displayPictureData: currDisplayPictureData } = dataForThisAlias || {};
  // For recording Mixpanel events
  const [storeWorkspaceEvent] = useStoreWorkspaceEventMutation();

  // We prioritize edited values over current values
  const displayedDisplayName = newDisplayName ?? currDisplayName ?? '';
  const displayedDisplayPictureData = {
    profileAccentColor: currDisplayPictureData?.profileAccentColor,
    profileCustomURI: currDisplayPictureData?.profileCustomURI,
    profileIcon: currDisplayPictureData?.profileIcon,
    ...newDisplayPictureData
  };

  // Whether the user is creating a new alias or editing the profile of an existing one
  const isEditing = !addAlias;
  // Alias profile modal title
  const title = isEditing ? 'Edit address profile' : 'Create address';
  // Alias profile modal description
  const description = isEditing
    ? `Edit your display name and profile photo for “${alias}”`
    : 'Create additional addresses for sending and receiving mail';

  const forceTheme = isMobile ? ThemeMode.DARK : undefined;

  // Closes modal and resets edited values
  const onClose = () => {
    setIsOpen(false);
    setAlias?.('');
    setNewDisplayName(undefined);
    setNewDisplayPictureData(undefined);
  };

  const updateAliasInfo = async () => {
    const suffix =
      newEmailAliasInputProps.selectedCustomDomain && !alias.includes('@')
        ? `@${newEmailAliasInputProps.selectedCustomDomain}`
        : '';
    try {
      const res = await updateAliasProfile({
        variables: {
          request: {
            emailAlias: alias + suffix,
            displayName: displayedDisplayName,
            displayPictureData: displayedDisplayPictureData
          }
        }
      });

      if (res.data?.updateEmailAliasProfile) {
        await refetch();
      }
      onClose();
    } catch (_) {
      enqueueToast({
        title: 'Could not update address info',
        body: 'Try saving again.'
      });
    }
  };

  const onSave = async () => {
    if (isEditing) {
      // Editing existing alias
      await updateAliasInfo();
    } else {
      if (
        !newEmailAliasInputProps.selectedCustomDomain && // only for skiff aliases
        isPremiumUsername(alias)
      ) {
        // track interest in premium aliases for future reference
        void storeWorkspaceEvent({
          variables: {
            request: {
              eventName: WorkspaceEventType.PremiumUsernameClaimAttempted,
              data: alias,
              version: DEFAULT_WORKSPACE_EVENT_VERSION
            }
          }
        });
      }
      if (!preSubmitError && !postSubmitError) {
        setIsAddAliasConfirmOpen(true);
      } else if (preSubmitError) {
        setPostSubmitError?.(preSubmitError);
      }
    }
  };

  const renderContent = () => (
    <>
      <ContentContainer>
        <DisplayPictureSection
          alias={alias}
          displayedDisplayName={displayedDisplayName}
          displayedDisplayPictureData={displayedDisplayPictureData}
          forceTheme={forceTheme}
          setNewDisplayPictureData={setNewDisplayPictureData}
        />
        <EmailAliasSection
          addAlias={addAlias}
          alias={alias}
          forceTheme={forceTheme}
          isAddAliasConfirmOpen={isAddAliasConfirmOpen}
          postSubmitError={postSubmitError}
          preSubmitError={preSubmitError}
          setAlias={setAlias}
          setIsAddAliasConfirmOpen={setIsAddAliasConfirmOpen}
          setPostSubmitError={setPostSubmitError}
          setPreSubmitError={setPreSubmitError}
          updateAliasInfo={updateAliasInfo}
          {...newEmailAliasInputProps}
        />
        <DisplayNameSection
          displayedDisplayName={displayedDisplayName}
          forceTheme={forceTheme}
          setNewDisplayName={setNewDisplayName}
        />
      </ContentContainer>
      <ButtonGroupContainer>
        <ButtonGroup forceTheme={forceTheme} fullWidth={isMobile}>
          <ButtonGroupItem label='Save' onClick={onSave} />
          <ButtonGroupItem label='Cancel' onClick={onClose} />
        </ButtonGroup>
      </ButtonGroupContainer>
    </>
  );

  return (
    <>
      {isMobile && (
        <Drawer hideDrawer={onClose} show={isOpen} title={title}>
          {renderContent()}
        </Drawer>
      )}
      {!isMobile && (
        <Dialog customContent description={description} onClose={onClose} open={isOpen} title={title}>
          {renderContent()}
        </Dialog>
      )}
    </>
  );
}

export default AliasProfileModal;
