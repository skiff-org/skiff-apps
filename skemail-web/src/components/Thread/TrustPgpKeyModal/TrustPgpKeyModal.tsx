import {
  ButtonGroup,
  ButtonGroupItem,
  Dialog,
  Typography,
  TypographyProps,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React, { useEffect } from 'react';
import { PgpPublicKey, readArmoredPublicKey } from 'skiff-crypto-v2';
import { useCreateOrUpdateContactMutation } from 'skiff-front-graphql';
import { PgpKeyTable, useGetContactWithEmailAddress, useToast } from 'skiff-front-utils';
import styled from 'styled-components';
import { v4 } from 'uuid';

import client from '../../../apollo/client';

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 9;
  position: relative;
`;

const Title = styled.div`
  display: flex;
  gap: 4px;
`;

const KeyContainer = styled.div`
  display: flex;
  padding: 12px;
  flex-direction: column;
  gap: 8px;
  align-self: stretch;
  border-radius: 8px;
  border: 1px solid var(--border-secondary);
  background: var(--bg-overlay-quaternary);
`;

const getEmailFromUserID = (userID?: string) => {
  if (!userID) return;
  return userID.split('<')[1]?.split('>')[0];
};

interface TrustPgpKeyModalProps {
  pgpKey: string;
  open: boolean;
  onClose: () => void;
}

export const TrustPgpKeyModal: React.FC<TrustPgpKeyModalProps> = ({ pgpKey, open, onClose }: TrustPgpKeyModalProps) => {
  const [activeKey, setActiveKey] = React.useState<PgpPublicKey | undefined>(undefined);
  const [createOrUpdateContact] = useCreateOrUpdateContactMutation();
  const { enqueueToast } = useToast();

  const userIDs = activeKey?.getUserIDs();
  // derive sender from key
  const sender = userIDs?.length ? getEmailFromUserID(userIDs[0]) : undefined;
  const existingContact = useGetContactWithEmailAddress({ emailAddress: sender, client });

  const titleTypographyProps: Pick<TypographyProps, 'size' | 'weight'> = {
    size: TypographySize.H4,
    weight: TypographyWeight.MEDIUM
  };

  useEffect(() => {
    const fetchActiveKey = async () => {
      const activePublicKey = await readArmoredPublicKey(pgpKey);
      setActiveKey(activePublicKey);
    };
    void fetchActiveKey();
  }, [pgpKey]);

  const handleSave = async () => {
    // TODO: save PGP to contact info
    if (!sender) return;
    try {
      await createOrUpdateContact({
        variables: {
          request: {
            contactID: existingContact?.contactID || v4(),
            emailAddress: sender,
            firstName: null,
            lastName: null,
            displayPictureData: null,
            encryptedContactData: null,
            encryptedSessionKey: null,
            encryptedByKey: null
          }
        }
      });
      enqueueToast({
        title: 'Key trusted',
        body: `Key for ${sender} has been trusted.`
      });
      onClose();
    } catch (err) {
      enqueueToast({
        title: 'Failed to trust key',
        body: `Failed to trust key for ${sender}.`
      });
    }
  };

  const onTrust = () => {
    // save contact with populated PGP directly
    void handleSave();
  };

  if (!open) {
    return null;
  }

  return (
    <Dialog customContent hideCloseButton onClose={onClose} open={open}>
      <Header>
        <Title>
          <Typography {...titleTypographyProps}>Trust attached public key?</Typography>
        </Title>
        <Typography color='secondary' wrap>
          {`Trusting this key will create a contact${
            sender ? ` for ${sender}` : ''
          } and automatically be used for encrypting/decrypting mail.`}
        </Typography>
      </Header>
      {activeKey && (
        <KeyContainer>
          <PgpKeyTable activePublicKey={activeKey} address='test' hideActions isSkiffManagedKey />
        </KeyContainer>
      )}
      <ButtonGroup>
        <ButtonGroupItem key='Confirm' label='Trust' onClick={onTrust} />
        <ButtonGroupItem key='back' label='Back' onClick={() => onClose()} />
      </ButtonGroup>
    </Dialog>
  );
};
