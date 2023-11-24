import { Dialog } from 'nightwatch-ui';
import { useCallback, useEffect, useState } from 'react';
import { uploadRecoveryData } from 'skiff-front-graphql';
import {
  AccountRecoveryInstruction,
  DEFAULT_WORKSPACE_EVENT_VERSION,
  exportRecoveryKeyToClient,
  getRecoveryPDFNameFromUsername,
  setBrowserRecoveryShare,
  useDefaultEmailAlias,
  useRequiredCurrentUserData
} from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';

import client from '../../../../apollo/client';
import { useIosKeyboardHeight } from '../../../../hooks/useIosKeyboardHeight';
import { storeWorkspaceEvent } from '../../../../utils/userUtils';

type AccountRecoveryDialogProps = {
  /** Closes the dialog */
  closeDialog: () => void;
  /** Whether or not dialog is open */
  isOpen: boolean;
};

/**
 * A component for rendering the account recovery modal/popup when a user enables the feature.
 */
export default function AccountRecoveryDialog({ isOpen, closeDialog }: AccountRecoveryDialogProps) {
  const keyboardHeight = useIosKeyboardHeight('recoverykey');
  const userData = useRequiredCurrentUserData();
  const { username, userID, recoveryEmail } = userData;
  const [defaultEmailAlias] = useDefaultEmailAlias(userID);

  // Recovery key
  const [recoveryPaperShare, setRecoveryPaperShare] = useState('');

  const onDownloadPDF = async () => {
    // Get file name from username.
    const exportedFilename: string = getRecoveryPDFNameFromUsername(username);
    // Add recovery key to the PDF so it can be copyable.
    // Text is positioned absolutely (x and y in unit inches).
    const overlayText: { text: string; x: number; fontSize: number; fontFamily: string; maxLen: number } = {
      text: recoveryPaperShare,
      x: 1.25,
      fontSize: 13,
      fontFamily: 'Skiff Sans Text',
      maxLen: 6
    };
    await exportRecoveryKeyToClient(
      'Skiff Recovery Key',
      'Secret key',
      defaultEmailAlias,
      recoveryEmail,
      exportedFilename,
      overlayText
    );
    await storeWorkspaceEvent(WorkspaceEventType.AccountRecoveryToggle, 'enable', DEFAULT_WORKSPACE_EVENT_VERSION);
  };

  // Fetch and upload recovery data
  const getRecoveryData = useCallback(async () => {
    const recoveryData = await uploadRecoveryData(userData, client);
    setRecoveryPaperShare(recoveryData.recoveryPaperShare);
    setBrowserRecoveryShare(recoveryData.recoveryBrowserShare, client);
  }, [userData]);

  useEffect(() => {
    if (isOpen && !recoveryPaperShare) void getRecoveryData();
    else if (!isOpen && !!recoveryPaperShare) setRecoveryPaperShare('');
  }, [getRecoveryData, isOpen, recoveryPaperShare]);

  return (
    <Dialog customContent onClose={closeDialog} open={isOpen} title='Save recovery key'>
      <AccountRecoveryInstruction
        keyboardHeight={keyboardHeight}
        onClose={closeDialog}
        onDownloadPDF={onDownloadPDF}
        recoveryPaperShare={recoveryPaperShare}
      />
    </Dialog>
  );
}
