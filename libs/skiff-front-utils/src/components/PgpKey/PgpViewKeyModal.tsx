import { ButtonGroup, ButtonGroupItem, Dialog, Type, Typography, TypographySize } from 'nightwatch-ui';
import React from 'react';
import { PgpPublicKey } from 'skiff-crypto-v2';
import styled from 'styled-components';
import { useToast } from '../../hooks';

const KeyContainer = styled(Typography)`
  display: flex;
  flex-direction: column;
  padding: 10px;
  box-sizing: border-box;
  border-radius: 4px;
  background: var(--bg-overlay-tertiary);
  box-shadow: var(--inset-shadow);
  overflow: auto;
  width: 100%;
  max-height: 240px;
  > span {
    overflow-y: auto;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    margin-top: 0px;
  }
`;

interface PgpViewKeyModalProps {
  address: string;
  onClose: () => void;
  open: boolean;
  publicKey: PgpPublicKey;
}

const PgpViewKeyModal: React.FC<PgpViewKeyModalProps> = ({ onClose, open, publicKey, address }) => {
  const { enqueueToast } = useToast();
  const pgpString = publicKey.armor();
  const onCopy = () => {
    enqueueToast({
      title: 'PGP key copied to clipboard'
    });
    void navigator.clipboard.writeText(pgpString);
  };

  return (
    <Dialog
      customContent
      description={`Full PGP key for ${address}`}
      onClose={onClose}
      open={open}
      title='View full key'
      hideCloseButton
      width={560}
    >
      <KeyContainer mono size={TypographySize.SMALL} color='disabled' wrap>
        {pgpString}
      </KeyContainer>
      <ButtonGroup>
        <ButtonGroupItem type={Type.SECONDARY} label='Copy' onClick={onCopy} />
        <ButtonGroupItem label='Close' onClick={onClose} />
      </ButtonGroup>
    </Dialog>
  );
};

export default PgpViewKeyModal;
