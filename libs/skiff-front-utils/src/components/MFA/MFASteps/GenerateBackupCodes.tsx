import { Button, CircularProgress, Icon, IconText, Size, Type, Typography } from '@skiff-org/skiff-ui';
import React, { useState } from 'react';
import styled from 'styled-components';

import { useRequiredCurrentUserData } from '../../../apollo';
import { useToast } from '../../../hooks';
import { copyToClipboardWebAndMobile, exportRecoveryKeyToClient } from '../../../utils';

const DOWNLOAD_AWAIT_TIME = 2500;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const BackupCodesLayout = styled.div`
  width: 100%;
  height: 178px;
  display: flex;
  background: var(--bg-overlay-tertiary);
  box-shadow: var(--inset-empty);
  border-radius: 8px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const RightContainer = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  gap: 12px;
`;

const CodeField = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
`;

const CodeContainer = styled.div`
  background: var(--bg-overlay-tertiary);
  box-shadow: var(--inset-empty);
  padding: 32px 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(116px, 1fr));
  grid-auto-flow: row dense;
  grid-template-rows: 1fr min-content;
  column-gap: 12px;
  row-gap: 12px;
  border-radius: 8px;
`;

type GenerateBackupCodesProps = {
  username: string;
  backupCodes?: Array<string>;
  getNewCodes: () => void;
};

/** Component that renders the step that generates the backup codes for the user to copy or download */
function GenerateBackupCodes({ username, backupCodes, getNewCodes }: GenerateBackupCodesProps) {
  const { enqueueToast } = useToast();
  const { recoveryEmail } = useRequiredCurrentUserData();
  // Whether the PDF is being downloaded
  const [isDownloading, setIsDownloading] = useState(false);

  const exportBackupCodesToPDF = () => {
    if (!backupCodes) return;
    const overlayText = {
      text: backupCodes.join('  '),
      x: 1.25,
      fontSize: 13,
      maxLen: 9
    };
    const exportedFilename = `${username}_skiff_MFA_backup_codes.pdf`;
    void exportRecoveryKeyToClient(
      'Skiff MFA Backup Codes',
      'Mfa backup codes (Use one at a time)',
      undefined,
      undefined,
      exportedFilename,
      overlayText
    );
  };

  // Download PDF
  const onSubmit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    exportBackupCodesToPDF();
    setTimeout(() => setIsDownloading(false), DOWNLOAD_AWAIT_TIME);
  };

  const copyToClipboard = () => {
    if (!backupCodes) return;
    copyToClipboardWebAndMobile(backupCodes.join('\n'));
    enqueueToast({
      title: 'Backup codes copied to clipboard',
      body: 'You can now paste them into a secure location.'
    });
  };

  // Render codes in two-column layout
  const renderCodeDisplay = () => (
    <CodeContainer>
      {backupCodes?.map((code) => {
        return (
          <CodeField key={code}>
            <Typography color='secondary' mono>
              {code}
            </Typography>
          </CodeField>
        );
      })}
    </CodeContainer>
  );

  return (
    <Container>
      <Typography color='secondary' wrap>
        Use these codes to access your account if you can&apos;t receive two-factor authentication codes. Each code may
        only be used once.
      </Typography>
      {!backupCodes && (
        <BackupCodesLayout>
          {/* Render moon loader while codes are loading */}
          {!backupCodes && <CircularProgress size={Size.X_MEDIUM} spinner />}
        </BackupCodesLayout>
      )}
      {!!backupCodes && (
        <>
          {!backupCodes.length && (
            <BackupCodesLayout>
              <Typography color='disabled'>No backup codes found.</Typography>
            </BackupCodesLayout>
          )}
          {/* Backup codes loaded */}
          {!!backupCodes.length && renderCodeDisplay()}
        </>
      )}
      <ButtonGroup>
        {!!backupCodes && !!backupCodes.length && (
          <IconText label='Copy' onClick={copyToClipboard} startIcon={Icon.Copy} />
        )}
        <RightContainer>
          <Button disabled={!backupCodes} onClick={getNewCodes} type={Type.SECONDARY}>
            Regenerate codes
          </Button>
          <Button loading={isDownloading} onClick={onSubmit}>
            Download
          </Button>
        </RightContainer>
      </ButtonGroup>
    </Container>
  );
}

export default GenerateBackupCodes;
