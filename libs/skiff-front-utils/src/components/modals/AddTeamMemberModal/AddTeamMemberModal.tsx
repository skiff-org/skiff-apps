import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { Dialog, Drawer } from '@skiff-org/skiff-ui';
import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { PaywallErrorCode } from 'skiff-utils';

import { TabPage, SettingsPage } from '../../Settings/Settings.types';
import PaywallModal from '../PaywallModal';

import InviteByEmail from './InviteByEmail';
import ProvisionAccount from './ProvisionAccount';
import SelectInviteOption from './SelectInviteOption';

enum ModalStep {
  SELECT_OPTION = 'SELECT_OPTION',
  EMAIL_INVITE = 'INVITE_EMAIL',
  PROVISION_USER = 'PROVISION_USER',
  CONFIRM_PROVISION = 'CONFIRM_PROVISION'
}

interface AddTeamMemberModalProps {
  client: ApolloClient<NormalizedCacheObject>;
  open: boolean;
  everyoneTeamDocID: string;
  onClose: () => void;
  openSettings: (page: SettingsPage) => void;
  workspaceName?: string;
}

const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({
  client,
  open,
  everyoneTeamDocID,
  onClose: onCloseProp,
  openSettings,
  workspaceName
}) => {
  const [paywallErrorCode, setPaywallErrorCode] = useState<PaywallErrorCode | null>(null);

  const [inviteStep, setInviteStep] = useState(ModalStep.SELECT_OPTION);

  const returnToSelect = () => setInviteStep(ModalStep.SELECT_OPTION);

  const onClose = () => {
    onCloseProp();
    setInviteStep(ModalStep.SELECT_OPTION);
  };

  const renderDialogBody = () => {
    switch (inviteStep) {
      case ModalStep.SELECT_OPTION:
        return (
          <SelectInviteOption
            onClickProvisionUser={() => setInviteStep(ModalStep.PROVISION_USER)}
            onClickSendInvite={() => setInviteStep(ModalStep.EMAIL_INVITE)}
          />
        );
      case ModalStep.EMAIL_INVITE:
        return (
          <InviteByEmail
            client={client}
            everyoneTeamDocID={everyoneTeamDocID}
            onCancel={returnToSelect}
            onClose={onClose}
            setPaywallErrorCode={setPaywallErrorCode}
            workspaceName={workspaceName}
          />
        );
      case ModalStep.PROVISION_USER:
      case ModalStep.CONFIRM_PROVISION:
        return (
          <ProvisionAccount
            client={client}
            onBack={() => setInviteStep(ModalStep.PROVISION_USER)}
            onCancel={returnToSelect}
            onClose={onClose}
            onConfirm={() => setInviteStep(ModalStep.CONFIRM_PROVISION)}
            setPaywallErrorCode={setPaywallErrorCode}
            showConfirmProvision={inviteStep === ModalStep.CONFIRM_PROVISION}
          />
        );
    }
  };

  const onPaywallUpgradeClicked = () => {
    setPaywallErrorCode(null);
    onClose();
    openSettings({
      indices: { tab: TabPage.Plans }
    });
  };

  const getDialogTitle = () => {
    switch (inviteStep) {
      case ModalStep.EMAIL_INVITE:
        return 'Send an invite';
      case ModalStep.PROVISION_USER:
        return 'Provision an account';
      case ModalStep.CONFIRM_PROVISION:
        return 'Confirm';
      case ModalStep.SELECT_OPTION:
        return 'Add team member';
    }
  };

  const getDialogDescription = () => {
    switch (inviteStep) {
      case ModalStep.EMAIL_INVITE:
        return 'Invited users will be asked to create an alias and password for their new workspace account.';
      case ModalStep.PROVISION_USER:
        return 'Invited members will receive credentials for a new workspace account.';
      case ModalStep.CONFIRM_PROVISION:
        return 'Send credentials to this email address?';
      case ModalStep.SELECT_OPTION:
        return '';
    }
  };

  return (
    <>
      {isMobile && (
        <Drawer extraSpacer hideDrawer={onClose} maxHeight='95vh' show={open} title={getDialogTitle()}>
          <div className='mobile-avoiding-keyboard'>{renderDialogBody()}</div>
        </Drawer>
      )}
      {!isMobile && (
        <Dialog
          customContent
          dataTest='workspace-invite-modal'
          description={getDialogDescription()}
          disableTextSelect
          hideCloseButton
          onClose={onClose}
          open={open}
          title={getDialogTitle()}
        >
          {renderDialogBody()}
        </Dialog>
      )}
      {paywallErrorCode && (
        <PaywallModal
          onClose={() => setPaywallErrorCode(null)}
          onUpgrade={onPaywallUpgradeClicked}
          open={!!paywallErrorCode}
          paywallErrorCode={paywallErrorCode}
        />
      )}
    </>
  );
};

export default AddTeamMemberModal;
