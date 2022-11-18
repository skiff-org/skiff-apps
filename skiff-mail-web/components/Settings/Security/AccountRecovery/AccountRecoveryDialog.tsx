import { Dialog } from 'nightwatch-ui';
import React, { useCallback, useEffect, useState } from 'react';
import {
  AccountRecoveryInstruction,
  AccountRecoveryPDF,
  DEFAULT_WORKSPACE_EVENT_VERSION,
  getRecoveryPDFNameFromUsername,
  PDF_ID,
  TOP_CLASS,
  BOTTOM_CLASS,
  AccountRecoveryAction,
  exportRecoveryKeyToClient
} from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';
import { uploadRecoveryData } from 'skiff-mail-graphql';

import client from '../../../../apollo/client';
import { setBrowserRecoveryShare, useRequiredCurrentUserData } from '../../../../apollo/currentUser';
// eslint-disable-next-line import/no-cycle
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
  const { email, username } = userData;

  // Recovery key
  const [recoveryPaperShare, setRecoveryPaperShare] = useState('');

  // Exports the recovery key component (referenced by PDF_ID) as a PDF and adds the recovery key text as an overlay.
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
      PDF_ID as string,
      TOP_CLASS as string,
      BOTTOM_CLASS as string,
      exportedFilename,
      overlayText
    );
    await storeWorkspaceEvent(WorkspaceEventType.AccountRecoveryToggle, 'enable', DEFAULT_WORKSPACE_EVENT_VERSION);
  };

  // Fetch and upload recovery data
  const getRecoveryData = useCallback(async () => {
    const recoveryData = await uploadRecoveryData(userData, AccountRecoveryAction.UPLOAD, client);
    setRecoveryPaperShare(recoveryData.recoveryBrowserShare);
    setBrowserRecoveryShare(recoveryData.recoveryPaperShare);
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
      <AccountRecoveryPDF displayName={email ?? username} />
    </Dialog>
  );
}
