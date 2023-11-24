import {
  ButtonGroup,
  ButtonGroupItem,
  Dialog,
  DialogType,
  Divider,
  InputField,
  Layout,
  Typography,
  Size
} from 'nightwatch-ui';
import { FC, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { PermissionLevel } from 'skiff-graphql';
import styled from 'styled-components';

import { useCurrentOrganization, useCurrentUserIsOrgAdmin } from '../../../hooks';
import Checkbox from '../../Checkbox/Checkbox';
import { UserAvatar } from '../../UserAvatar';

const WorkspaceNameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px;
  gap: 12px;
  width: 100%;

  border: 1px solid var(--border-secondary);
  border-radius: 12px;
  box-sizing: border-box;
`;

const ConfirmationsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 4px;
`;

const ConfirmationLine = styled.div`
  display: flex;
  gap: 10px;
  align-items: start;
`;

const ButtonContainer = styled.div`
  margin-top: 12px;
  width: 100%;
`;

const CheckboxContainer = styled.div`
  margin-top: 2px;
`;

const NextAdminLine = styled.div`
  margin-top: 4px;
  display: flex;
  gap: 4px;
`;

const DELETE_ACCOUNT_AFFIRMATION = 'I want to delete my account';

interface ConfirmDeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
}

const ConfirmDeleteAccountModal: FC<ConfirmDeleteAccountModalProps> = ({ open, onClose, onConfirm }) => {
  const { data: workspaceData } = useCurrentOrganization();
  const [inputValue, setInputValue] = useState('');
  const [workspaceInputError, setWorkspaceInputError] = useState(false);
  const [dataChecked, setDataChecked] = useState(false);
  const [dataCheckedError, setDataCheckedError] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailCheckedError, setEmailCheckedError] = useState(false);
  const collaborators = workspaceData?.organization.everyoneTeam.rootDocument?.collaborators;
  const isAdmin = useCurrentUserIsOrgAdmin();

  // Returns the editor that will be promoted to admin, if current user is admin
  //   1. There are no other admins besides the current user
  //   2. There are other editors that exist in the org
  const nextAdmin = useMemo(() => {
    if (!isAdmin || !collaborators) {
      return null;
    }
    // If multiple admins, then no need for upgrading any editor
    const orgHasMultipleAdmins = collaborators.filter((c) => c.permissionLevel === PermissionLevel.Admin).length > 1;
    if (orgHasMultipleAdmins) {
      return null;
    }
    const firstEditor = collaborators.find((c) => c.permissionLevel === PermissionLevel.Editor);
    return firstEditor ? firstEditor.user : null;
  }, [collaborators, isAdmin]);

  const checkWorkspaceNameAndSubmit = () => {
    let hasError = false;
    // Confirm workspace name matches. Trim whitespace at end because spaces at end are hard to see.
    if (inputValue.trimEnd().toLowerCase() !== DELETE_ACCOUNT_AFFIRMATION.trimEnd().toLowerCase()) {
      setWorkspaceInputError(true);
      hasError = true;
    }

    // Confirm checkbox
    if (!dataChecked) {
      setDataCheckedError(true);
      hasError = true;
    }

    if (!emailChecked) {
      setEmailCheckedError(true);
      hasError = true;
    }

    if (!hasError) {
      void onConfirm();
    }
  };

  return (
    <Dialog
      customContent
      description='Deleting your account is an irreversible action. All data will be erased and cannot be retrieved after 7 days.'
      hideCloseButton
      onClose={onClose}
      open={open}
      title='Verify account deletion'
      type={DialogType.DEFAULT}
    >
      <WorkspaceNameContainer>
        <Typography wrap>To proceed, please type in the following affirmation</Typography>
        <InputField
          error={workspaceInputError}
          onChange={(e) => {
            setWorkspaceInputError(false);
            setInputValue(e.target.value);
          }}
          placeholder={DELETE_ACCOUNT_AFFIRMATION}
          value={inputValue}
        />
      </WorkspaceNameContainer>
      <ConfirmationsContainer>
        <ConfirmationLine>
          <CheckboxContainer>
            <Checkbox
              checked={dataChecked}
              error={dataCheckedError}
              onClick={() => {
                setDataCheckedError(false);
                setDataChecked((prev) => !prev);
              }}
            />
          </CheckboxContainer>
          <Typography wrap>I understand all my data will be lost if I delete my account</Typography>
        </ConfirmationLine>
        <ConfirmationLine>
          <CheckboxContainer>
            <Checkbox
              checked={emailChecked}
              error={emailCheckedError}
              onClick={() => {
                setEmailCheckedError(false);
                setEmailChecked((prev) => !prev);
              }}
            />
          </CheckboxContainer>
          <Typography wrap>
            I understand that all my email addresses will be permanently lost and cannot be reclaimed
          </Typography>
        </ConfirmationLine>
      </ConfirmationsContainer>
      {nextAdmin && (
        <>
          <Divider />
          <NextAdminLine>
            <UserAvatar
              displayPictureData={nextAdmin.publicData.displayPictureData}
              label={nextAdmin.publicData.displayName || nextAdmin.username || 'A'}
              size={Size.SMALL}
            />
            <Typography color='secondary' wrap>
              {nextAdmin.publicData.displayName || nextAdmin.username} will become the new admin
            </Typography>
          </NextAdminLine>
        </>
      )}
      <ButtonContainer>
        <ButtonGroup fullWidth={isMobile} layout={isMobile ? Layout.STACKED : Layout.INLINE}>
          <ButtonGroupItem key='delete' label='Delete account' onClick={checkWorkspaceNameAndSubmit} />
          <ButtonGroupItem key='back' label='Back' onClick={onClose} />
        </ButtonGroup>
      </ButtonContainer>
    </Dialog>
  );
};

export default ConfirmDeleteAccountModal;
