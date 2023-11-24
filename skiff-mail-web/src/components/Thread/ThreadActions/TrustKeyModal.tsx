import {
  ButtonGroup,
  ButtonGroupItem,
  Dialog,
  Size,
  Toggle,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import { useState } from 'react';
import { useUserPreference } from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

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

const ToggleContainer = styled.div`
  display: flex;
  padding: 16px;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  align-self: stretch;
  border-radius: 8px;
  border: 1px solid var(--border-secondary);
  background: var(--bg-overlay-quaternary);
`;

interface TrustKeyModalProps {
  open: boolean;
  onClose: () => void;
  onTrustKey: () => void;
}

const TrustKeyModal = ({ open, onClose, onTrustKey }: TrustKeyModalProps) => {
  const [trustKey, setTrustKey] = useUserPreference(StorageTypes.CONFIRM_TRUST_KEY);

  const [loading, setLoading] = useState(false);
  const onChange = () => setTrustKey(!trustKey);
  const onConfirm = () => {
    setLoading(true);
    onTrustKey();
    setLoading(false);
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog customContent hideCloseButton onClose={onClose} open={open} width={350}>
      <Header>
        <Title>
          <Typography size={TypographySize.H4} weight={TypographyWeight.MEDIUM}>
            Trust this key?
          </Typography>
        </Title>
        <Typography color='secondary' wrap>
          You can view and manage the trusted key in your contacts page.
        </Typography>
      </Header>
      <ToggleContainer>
        <Typography color='secondary'>Always ask for confirmation</Typography>
        <Toggle checked={trustKey} onChange={onChange} size={Size.MEDIUM} />
      </ToggleContainer>
      <ButtonGroup>
        <ButtonGroupItem key='Confirm' label='Confirm' loading={loading} onClick={onConfirm} />
        <ButtonGroupItem key='back' label='Back' onClick={onClose} />
      </ButtonGroup>
    </Dialog>
  );
};

export default TrustKeyModal;
