import { Dropdown, DropdownItem, Icon, IconText, ThemeMode, Typography, TypographySize } from 'nightwatch-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useGetFullAliasInfoQuery, useGetPgpInfoQuery, useUpdateEmailAliasProfileMutation } from 'skiff-front-graphql';
import { DisplayPictureData, PgpInfo, PgpKeyStatus } from 'skiff-graphql';
import { PgpFlag } from 'skiff-utils';
import styled from 'styled-components';

import { useGetFF, useToast } from '../../../hooks';
import { useGeneratePgpKey } from '../../../hooks/pgp/useGeneratePgpKey';
import { useImportKey } from '../../../hooks/pgp/useImportKey';
import { NewEmailAliasInputProps } from '../../NewEmailAliasInput';
import { openImportPgpKeyDialog } from '../../PgpKey/Pgp.utils';
import PgpSection from '../../PgpKey/PgpSection';
import { ConfirmModal } from '../../modals';
import DisplayNameSection from '../../modals/AliasProfileModal/DisplayNameSection';
import DisplayPictureSection from '../../modals/AliasProfileModal/DisplayPictureSection';
import EmailAliasSection from '../../modals/AliasProfileModal/EmailAliasSection';
import { SettingsPage } from '../Settings.types';
import EmailAliasOptions from './EmailAliasOptions';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 50%;
  overflow: hidden;
  height: 100%;
  box-sizing: border-box;
  border-left: 1px solid var(--border-secondary);
  background: var(--bg-l2-solid);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  background: var(--bg-l3-solid);
  border-bottom: 1px solid var(--border-secondary);
`;

const ScrollView = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  gap: 16px;
  padding: 8px;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  justify-content: flex-start;
  align-items: flex-start;
  box-sizing: border-box;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const TitleAction = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

interface SelectedAddressViewProps extends Partial<Omit<NewEmailAliasInputProps, 'newAlias' | 'addAlias'>> {
  /** Email selectedAddress being edited/created */
  selectedAddress: string;
  setSelectedAddress: (selectedAddress: string | undefined) => void;
  includeDeleteOption: boolean;
  userID: string;
  deleteEmailAlias: (alias: string) => Promise<void>;
  onSetDefaultAlias?: (newValue: string) => void;
  openSettings?: (page: SettingsPage) => void;
}

function SelectedAddressView({
  selectedAddress,
  setSelectedAddress,
  // New email selectedAddress props
  preSubmitError,
  postSubmitError,
  setAlias,
  setPreSubmitError,
  setPostSubmitError,
  includeDeleteOption,
  userID,
  deleteEmailAlias,
  onSetDefaultAlias,
  openSettings,
  ...newEmailAliasInputProps
}: SelectedAddressViewProps) {
  const hasPgpFlag = useGetFF<PgpFlag>('pgp');
  // State
  // Edited display name
  const [newDisplayName, setNewDisplayName] = useState<string | undefined>(undefined);
  // Edited selectedAddress display picture data
  const [newDisplayPictureData, setNewDisplayPictureData] = useState<DisplayPictureData>();
  // Create selectedAddress confirm dialog opened/closed state
  const [isAddAliasConfirmOpen, setIsAddAliasConfirmOpen] = useState(false);

  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const addButtonRef = useRef<HTMLDivElement>(null);

  const openAddDropdown = () => {
    setShowAddDropdown(true);
  };
  const closeGenerateModal = () => {
    setShowGenerateModal(false);
  };
  const openGenerateModal = () => {
    setShowAddDropdown(false);
    setShowGenerateModal(true);
  };

  // Custom hooks
  const { enqueueToast } = useToast();
  const { importKey } = useImportKey();

  // Graphql
  const [updateAliasProfile] = useUpdateEmailAliasProfileMutation();
  // Data for the address profile is derived from the address info query
  const { data: aliasData, refetch } = useGetFullAliasInfoQuery();
  // Alias-specific data - note we use the full address query so that refetch updates the full list properly on save
  const dataForThisAlias = aliasData?.fullAliasInfo?.find(
    (aliasInfo: { emailAlias: string }) => aliasInfo?.emailAlias === selectedAddress
  );
  // Current, unedited address display name and display picture data
  const { displayName: currDisplayName, displayPictureData: currDisplayPictureData } = dataForThisAlias || {};

  // We prioritize edited values over current values
  const displayedDisplayName = newDisplayName ?? currDisplayName ?? '';
  const displayedDisplayPictureData = {
    profileAccentColor: currDisplayPictureData?.profileAccentColor,
    profileCustomURI: currDisplayPictureData?.profileCustomURI,
    profileIcon: currDisplayPictureData?.profileIcon,
    ...newDisplayPictureData
  };

  const { data: pgpKeyData, refetch: refetchPgpKey } = useGetPgpInfoQuery({
    variables: { emailAlias: selectedAddress, allKeys: true }
  });
  const pgpKeys = pgpKeyData?.pgpInfo as PgpInfo[];
  const activeKey = pgpKeys?.find((key) => key.status === PgpKeyStatus.Enabled);
  // Whether the user is creating a new address or editing the profile of an existing one
  const forceTheme = isMobile ? ThemeMode.DARK : undefined;

  // Closes modal and resets edited values
  const onClose = () => {
    setAlias?.('');
    setNewDisplayName(undefined);
    setNewDisplayPictureData(undefined);
  };

  const { generateKey } = useGeneratePgpKey(!!activeKey, closeGenerateModal);

  const updateAliasInfo = async () => {
    const suffix =
      newEmailAliasInputProps.selectedCustomDomain && !selectedAddress.includes('@')
        ? `@${newEmailAliasInputProps.selectedCustomDomain}`
        : '';
    try {
      const res = await updateAliasProfile({
        variables: {
          request: {
            emailAlias: selectedAddress + suffix,
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

  const updateAliasInfoCallback = useCallback(updateAliasInfo, [
    displayedDisplayName,
    displayedDisplayPictureData,
    enqueueToast,
    refetch,
    selectedAddress
  ]);

  // updateAliasInfo when any of the changed values are saved
  useEffect(() => {
    if (newDisplayName || newDisplayPictureData) {
      void updateAliasInfoCallback();
    }
  }, [newDisplayName, newDisplayPictureData, updateAliasInfoCallback]);

  return (
    <Container>
      <Header>
        <IconText
          color='secondary'
          onClick={() => {
            setSelectedAddress(undefined);
          }}
          startIcon={Icon.Close}
        />
        <RightSection>
          <EmailAliasOptions
            alias={selectedAddress}
            deleteAlias={() => void deleteEmailAlias(selectedAddress)}
            includeDeleteOption={includeDeleteOption}
            onSetDefaultAlias={onSetDefaultAlias}
            openSettings={openSettings}
            setSelectedAddress={setSelectedAddress}
            userID={userID}
          />
        </RightSection>
      </Header>
      <ScrollView>
        <DisplayPictureSection
          alias={selectedAddress}
          displayedDisplayName={displayedDisplayName}
          displayedDisplayPictureData={displayedDisplayPictureData}
          forceTheme={forceTheme}
          setNewDisplayPictureData={setNewDisplayPictureData}
        />
        <EmailAliasSection
          alias={selectedAddress}
          forceTheme={forceTheme}
          isAddAliasConfirmOpen={isAddAliasConfirmOpen}
          postSubmitError={postSubmitError}
          preSubmitError={preSubmitError}
          setAlias={setAlias}
          setIsAddAliasConfirmOpen={setIsAddAliasConfirmOpen}
          setPostSubmitError={setPostSubmitError}
          setPreSubmitError={setPreSubmitError}
          updateAliasInfo={updateAliasInfoCallback}
          {...newEmailAliasInputProps}
        />
        <DisplayNameSection
          displayedDisplayName={displayedDisplayName}
          forceTheme={forceTheme}
          selectedAddress={selectedAddress}
          setNewDisplayName={setNewDisplayName}
        />
        {hasPgpFlag && (
          <TitleContainer>
            <TitleAction>
              <Typography color='disabled' mono size={TypographySize.SMALL} uppercase>
                Pgp key
              </Typography>
              <IconText color='secondary' onClick={openAddDropdown} ref={addButtonRef} startIcon={Icon.Plus} />
              <Dropdown
                buttonRef={addButtonRef}
                gapFromAnchor={8}
                portal
                setShowDropdown={setShowAddDropdown}
                showDropdown={showAddDropdown}
                width={200}
              >
                <DropdownItem
                  icon={Icon.Plus}
                  label={!!activeKey ? 'Regenerate key' : 'Generate new key'}
                  onClick={openGenerateModal}
                />
                <DropdownItem
                  icon={Icon.Upload}
                  label='Import key'
                  onClick={() => {
                    setShowAddDropdown(false);
                    openImportPgpKeyDialog(selectedAddress, true, !!activeKey, importKey, refetchPgpKey);
                  }}
                />
              </Dropdown>
              <ConfirmModal
                confirmName='Create key'
                description={`New generated key will become your primary key${
                  !!activeKey ? ' and deactivate the current active key' : ''
                }.`}
                onClose={closeGenerateModal}
                onConfirm={() => generateKey(currDisplayName || undefined, selectedAddress, refetchPgpKey)}
                open={showGenerateModal}
                title='Generate new key?'
              />
            </TitleAction>
            <PgpSection address={selectedAddress} ownKey openGenerateModal={openGenerateModal} />
          </TitleContainer>
        )}
      </ScrollView>
    </Container>
  );
}

export default SelectedAddressView;
